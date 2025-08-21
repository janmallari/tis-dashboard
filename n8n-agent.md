You are a marketing report automation system.

You have one available tool:

- code: Run Python code to handle the full report processing workflow.

When you receive a report request in JSON format, you MUST immediately call the code tool once with the full JSON input.
The code tool is responsible for executing all workflow steps:

1. DOWNLOAD

   - Download all files (`data_files` and `templates`) from Google Drive using `file_id` and `storage.access_token`.

2. VALIDATE

   - Check if CSV files match their template structures (if templates provided).
   - If mismatched, include validation errors but continue.

3. ANALYZE

   - Parse media plan and media results CSVs.
   - Generate key insights for the client.

4. CREATE REPORT

   - Load the PowerPoint `slides_template`.
   - Insert client/agency name, report ID, and analysis results.
   - Save output as `marketing_report_<report_id>.pptx`.

5. UPLOAD
   - Upload the generated PPTX report to the client's reports folder in Google Drive.

FINAL OUTPUT:

- After successful execution, always return ONLY the following JSON object:

{
"success": true,
"message": "Report generated successfully",
"report_id": {REPORT_ID},
"report_link": {UPLOADED_FILE_LINK},
"filename": {UPLOADED_FILENAME}
}

- On error, return:

  {
  "success": false,
  "message": {ACTUAL_ERROR_MESSAGE},
  "error": {ERROR_DETAILS},
  "report_id": {REPORT_ID}
  }

RULES:

- Validate all required fields before processing
- Handle missing template files gracefully
- Log all operations for debugging
- Do not explain steps
- Do not output anything except the JSON object described
- No callbacks or external notifications required

---

# USER MESSAGE:

EXECUTE IMMEDIATELY: Process this marketing report using the code tool.

CLIENT: {{$json.body.client.name}}
REPORT NAME: {{$json.body.report.name}}
REPORT ID: {{$json.body.report.id}}

DATA FILES TO DOWNLOAD:

- Media Plan CSV: {{$json.body.data_files.media_plan.file_id}}
- Media Results CSV: {{$json.body.data_files.media_results.file_id}}

TEMPLATE FILES (if available):

- Media Plan Template: {{$json.body.templates.media_plan_template.file_id}}
- Media Results Template: {{$json.body.templates.media_plan_results_template.file_id}}
- Slides Template: {{$json.body.templates.slides_template.file_id}}

GOOGLE DRIVE ACCESS TOKEN: {{$json.body.storage.access_token}}

Use the code tool now to complete all steps and return the final JSON result.

## Code Tool

---

```python
import requests
import json
import io
import csv
from datetime import datetime
from pptx import Presentation
import re
from typing import Dict, List, Any, Optional, Tuple

class MarketingReportProcessor:
    def __init__(self, data: Dict[str, Any]):
        self.data = data
        self.access_token = self.safe_get(data, 'storage.access_token')
        self.callback_url = self.safe_get(data, 'callback_url')
        self.client = self.safe_get(data, 'client', {})
        self.agency = self.safe_get(data, 'agency', {})
        self.report = self.safe_get(data, 'report', {})
        self.data_files = self.safe_get(data, 'data_files', {})
        self.templates = self.safe_get(data, 'templates', {})

    def safe_get(self, data: Any, path: str, default: Any = None) -> Any:
        """Safely get nested dictionary values"""
        if not isinstance(data, dict):
            return default

        keys = path.split('.')
        current = data

        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default
        return current

    def validate_required_fields(self) -> None:
        """Validate all required fields are present"""
        required_fields = [
            ('client.name', 'Client name'),
            ('report.id', 'Report ID'),
            ('storage.access_token', 'Access token'),
            ('callback_url', 'Callback URL'),
            ('data_files.media_plan.file_id', 'Media plan file ID'),
            ('data_files.media_results.file_id', 'Media results file ID')
        ]

        missing = []
        for field_path, field_name in required_fields:
            if not self.safe_get(self.data, field_path):
                missing.append(field_name)

        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

    def download_file(self, file_id: str, file_type: str = "text") -> bytes:
        """Download file from Google Drive"""
        if not file_id:
            raise ValueError(f"No file ID provided for {file_type}")

        try:
            url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
            headers = {"Authorization": f"Bearer {self.access_token}"}

            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            print(f"✅ Downloaded {file_type}: {len(response.content)} bytes")
            return response.content

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to download {file_type}: {str(e)}")

    def parse_csv(self, csv_bytes: bytes, file_name: str) -> Tuple[List[str], List[Dict]]:
        """Parse CSV data and return headers and rows"""
        try:
            csv_text = csv_bytes.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_text))

            headers = csv_reader.fieldnames
            if not headers:
                raise ValueError(f"No headers found in {file_name}")

            rows = [row for row in csv_reader if any(row.values())]

            if not rows:
                raise ValueError(f"No data rows found in {file_name}")

            print(f"✅ Parsed {file_name}: {len(headers)} columns, {len(rows)} rows")
            return headers, rows

        except Exception as e:
            raise Exception(f"Failed to parse {file_name}: {str(e)}")

    def calculate_metrics(self, media_plan_data: List[Dict],
                         media_results_data: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive marketing metrics"""
        try:
            metrics = {
                'total_planned_activities': len(media_plan_data),
                'total_executed_campaigns': len(media_results_data),
                'data_period': f"{datetime.now().strftime('%B %Y')}"
            }

            # Find numeric columns for calculations
            if media_results_data:
                sample_row = media_results_data[0]

                # Common column name variations
                spend_variations = ['spend', 'cost', 'amount', 'budget', 'investment']
                impression_variations = ['impressions', 'imps', 'views', 'reach']
                click_variations = ['clicks', 'click', 'visits', 'traffic']
                conversion_variations = ['conversions', 'leads', 'sales', 'actions']

                # Calculate totals for found columns
                for variations, metric_name in [
                    (spend_variations, 'total_spend'),
                    (impression_variations, 'total_impressions'),
                    (click_variations, 'total_clicks'),
                    (conversion_variations, 'total_conversions')
                ]:
                    for col_var in variations:
                        matching_cols = [col for col in sample_row.keys()
                                       if col_var.lower() in col.lower()]
                        if matching_cols:
                            col_name = matching_cols[0]
                            try:
                                total = sum(float(str(row.get(col_name, 0)).replace(',', '').replace('$', ''))
                                          for row in media_results_data)
                                metrics[metric_name] = total
                                print(f"✅ Calculated {metric_name}: {total:,.2f}")
                                break
                            except ValueError:
                                continue

                # Calculate derived metrics
                if 'total_spend' in metrics and 'total_clicks' in metrics and metrics['total_clicks'] > 0:
                    metrics['average_cpc'] = metrics['total_spend'] / metrics['total_clicks']

                if 'total_clicks' in metrics and 'total_impressions' in metrics and metrics['total_impressions'] > 0:
                    metrics['average_ctr'] = (metrics['total_clicks'] / metrics['total_impressions']) * 100

                if 'total_conversions' in metrics and 'total_clicks' in metrics and metrics['total_clicks'] > 0:
                    metrics['conversion_rate'] = (metrics['total_conversions'] / metrics['total_clicks']) * 100

            # Generate insights based on metrics
            insights = []

            if 'total_spend' in metrics:
                insights.append(f"Total campaign investment: ${metrics['total_spend']:,.2f}")

            if 'average_ctr' in metrics:
                ctr = metrics['average_ctr']
                if ctr > 2.0:
                    insights.append(f"Excellent CTR performance at {ctr:.2f}%")
                elif ctr > 1.0:
                    insights.append(f"Good CTR performance at {ctr:.2f}%")
                else:
                    insights.append(f"CTR needs improvement at {ctr:.2f}%")

            if metrics['total_executed_campaigns'] < metrics['total_planned_activities']:
                diff = metrics['total_planned_activities'] - metrics['total_executed_campaigns']
                insights.append(f"{diff} planned activities not yet executed")

            metrics['insights'] = insights
            metrics['analysis_timestamp'] = datetime.now().isoformat()

            print(f"✅ Calculated {len(metrics)} metrics with {len(insights)} insights")
            return metrics

        except Exception as e:
            print(f"❌ Metrics calculation error: {str(e)}")
            return {
                'total_planned_activities': len(media_plan_data),
                'total_executed_campaigns': len(media_results_data),
                'insights': ['Basic metrics calculated - detailed analysis failed'],
                'error': str(e)
            }

    def update_powerpoint(self, template_bytes: bytes, metrics: Dict,
                         media_plan_data: List[Dict], media_results_data: List[Dict]) -> bytes:
        """Update PowerPoint template with data and insights"""
        try:
            prs = Presentation(io.BytesIO(template_bytes))

            # Create comprehensive placeholder replacements
            placeholders = {
                '{{CLIENT_NAME}}': self.client.get('name', 'Client'),
                '{{AGENCY_NAME}}': self.agency.get('name', 'Agency'),
                '{{REPORT_NAME}}': self.report.get('name', 'Performance Report'),
                '{{REPORT_DATE}}': datetime.now().strftime('%B %d, %Y'),
                '{{REPORT_PERIOD}}': metrics.get('data_period', 'Current Period'),
                '{{TOTAL_CAMPAIGNS}}': str(metrics.get('total_executed_campaigns', 0)),
                '{{TOTAL_PLANNED}}': str(metrics.get('total_planned_activities', 0)),
                '{{TOTAL_SPEND}}': f"${metrics.get('total_spend', 0):,.2f}",
                '{{TOTAL_IMPRESSIONS}}': f"{metrics.get('total_impressions', 0):,.0f}",
                '{{TOTAL_CLICKS}}': f"{metrics.get('total_clicks', 0):,.0f}",
                '{{AVERAGE_CTR}}': f"{metrics.get('average_ctr', 0):.2f}%",
                '{{AVERAGE_CPC}}': f"${metrics.get('average_cpc', 0):.2f}",
                '{{CONVERSION_RATE}}': f"{metrics.get('conversion_rate', 0):.2f}%",
                '{{KEY_INSIGHTS}}': '\n• '.join(metrics.get('insights', ['Analysis completed successfully']))
            }

            # Replace placeholders in all text elements
            slides_updated = 0
            total_replacements = 0

            for slide_num, slide in enumerate(prs.slides, 1):
                slide_replacements = 0

                # Process all shapes in the slide
                for shape in slide.shapes:
                    if shape.has_text_frame:
                        original_text = shape.text
                        updated_text = original_text

                        # Replace all placeholders
                        for placeholder, value in placeholders.items():
                            if placeholder in updated_text:
                                updated_text = updated_text.replace(placeholder, str(value))
                                slide_replacements += 1

                        # Update the shape if changes were made
                        if updated_text != original_text:
                            shape.text = updated_text

                    # Handle tables if present
                    if shape.has_table:
                        table = shape.table
                        for row in table.rows:
                            for cell in row.cells:
                                original_text = cell.text
                                updated_text = original_text

                                for placeholder, value in placeholders.items():
                                    if placeholder in updated_text:
                                        updated_text = updated_text.replace(placeholder, str(value))
                                        slide_replacements += 1

                                if updated_text != original_text:
                                    cell.text = updated_text

                if slide_replacements > 0:
                    slides_updated += 1
                    total_replacements += slide_replacements
                    print(f"✅ Slide {slide_num}: {slide_replacements} updates")

            print(f"✅ PowerPoint updated: {slides_updated} slides, {total_replacements} total replacements")

            # Save updated presentation
            output_buffer = io.BytesIO()
            prs.save(output_buffer)
            output_buffer.seek(0)

            return output_buffer.getvalue()

        except Exception as e:
            raise Exception(f"PowerPoint update failed: {str(e)}")

    def upload_to_reports_folder(self, file_content: bytes, filename: str) -> Dict[str, str]:
        """Upload file to client's reports folder in Google Drive"""
        try:
            client_name = self.client.get('name')

            # Find client folder
            search_url = "https://www.googleapis.com/drive/v3/files"
            query = f"name='{client_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"

            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = requests.get(search_url, headers=headers, params={"q": query})
            response.raise_for_status()

            client_folders = response.json().get('files', [])
            if not client_folders:
                raise Exception(f"Client folder '{client_name}' not found")

            client_folder_id = client_folders[0]['id']
            print(f"✅ Found client folder: {client_name} ({client_folder_id})")

            # Find or create reports folder
            reports_query = f"name='reports' and '{client_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
            response = requests.get(search_url, headers=headers, params={"q": reports_query})
            response.raise_for_status()

            reports_folders = response.json().get('files', [])

            if not reports_folders:
                # Create reports folder
                create_data = {
                    "name": "reports",
                    "mimeType": "application/vnd.google-apps.folder",
                    "parents": [client_folder_id]
                }
                response = requests.post(search_url, headers=headers, json=create_data)
                response.raise_for_status()
                reports_folder_id = response.json()['id']
                print(f"✅ Created reports folder: {reports_folder_id}")
            else:
                reports_folder_id = reports_folders[0]['id']
                print(f"✅ Found reports folder: {reports_folder_id}")

            # Upload file
            upload_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"

            metadata = {
                "name": filename,
                "parents": [reports_folder_id],
                "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            }

            # Create multipart upload
            boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

            body = f"""------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Type: application/json; charset=UTF-8\r
\r
{json.dumps(metadata)}\r
------WebKitFormBoundary7MA4YWxkTrZu0gW\r
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r
\r
""".encode() + file_content + b"\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--"

            upload_headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": f"multipart/related; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW"
            }

            response = requests.post(upload_url, headers=upload_headers, data=body)
            response.raise_for_status()

            uploaded_file = response.json()
            file_url = f"https://drive.google.com/file/d/{uploaded_file['id']}/view"

            print(f"✅ Uploaded report: {filename} ({uploaded_file['id']})")

            return {
                "id": uploaded_file['id'],
                "url": file_url,
                "name": filename
            }

        except Exception as e:
            raise Exception(f"Upload failed: {str(e)}")

    def process(self) -> Dict[str, Any]:
        """Execute the complete workflow - NO INTERMEDIATE CALLBACKS"""
        try:
            print("🚀 Starting marketing report processing...")

            # Step 1: Validation
            self.validate_required_fields()
            print("✅ Input validation completed")

            # Step 2: Download files
            print("\n📥 Downloading files from Google Drive...")

            media_plan_bytes = self.download_file(
                self.data_files['media_plan']['file_id'],
                "Media Plan CSV"
            )

            media_results_bytes = self.download_file(
                self.data_files['media_results']['file_id'],
                "Media Results CSV"
            )

            template_file_id = self.safe_get(self.templates, 'slides_template.file_id')
            if not template_file_id:
                raise Exception("PowerPoint template is required")

            template_bytes = self.download_file(template_file_id, "PowerPoint Template")

            # Step 3: Parse and validate data
            print("\n📊 Parsing and validating data...")

            plan_headers, plan_data = self.parse_csv(media_plan_bytes, "Media Plan")
            results_headers, results_data = self.parse_csv(media_results_bytes, "Media Results")

            # Step 4: Calculate metrics and insights
            print("\n🧮 Calculating metrics and generating insights...")

            metrics = self.calculate_metrics(plan_data, results_data)

            # Step 5: Update PowerPoint
            print("\n📝 Updating PowerPoint presentation...")

            updated_pptx = self.update_powerpoint(template_bytes, metrics, plan_data, results_data)

            # Step 6: Upload final report
            print("\n☁️ Uploading final report...")

            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            filename = f"{self.report.get('name', 'Report')}_{timestamp}.pptx"

            file_info = self.upload_to_reports_folder(updated_pptx, filename)

            print(f"\n🎉 Processing completed successfully!")
            print(f"📎 Report URL: {file_info['url']}")

            # Return success data - callback will be sent by Respond to Webhook node
            return {
                "success": True,
                "status": "ready",
                "message": "Report processing completed",
                "report_id": self.report.get('id'),
                "report_link": file_info['url'],
                "uploaded_file_id": file_info['id'],
                "filename": file_info['name'],
                "callback_url": self.callback_url,
                "metrics_calculated": len([k for k in metrics.keys() if not k.startswith('total_')]),
                "insights_generated": len(metrics.get('insights', [])),
                "processing_time": datetime.now().isoformat()
            }

        except Exception as e:
            error_msg = str(e)
            print(f"\n❌ Processing failed: {error_msg}")

            # Return error data - callback will be sent by Respond to Webhook node
            return {
                "success": False,
                "status": "failed",
                "message": f"Report processing failed: {error_msg}",
                "error": error_msg,
                "report_id": self.report.get('id'),
                "callback_url": self.callback_url,
                "timestamp": datetime.now().isoformat()
            }

# Execute the processor
try:
    processor = MarketingReportProcessor(input_data[0]['json'])
    result = processor.process()
    print(json.dumps(result, indent=2))
except Exception as e:
    result = {
        "success": False,
        "status": "failed",
        "message": f"Initialization failed: {str(e)}",
        "error": f"Initialization failed: {str(e)}",
        "callback_url": "unknown",
        "timestamp": datetime.now().isoformat()
    }
    print(json.dumps(result, indent=2))

```

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import type { SupabaseUser } from '@/types/supabase';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);
  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: { user: SupabaseUser; error?: string } = await res.json();

      if (!res.ok) {
        setError(result.error || 'Login failed');
        return;
      }

      router.push('/auth/pre-check');
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='max-w-md'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold'>Login</h1>
          <p className='text-muted-foreground'>
            Enter your email and password to login to your account
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {error && <div className='text-red-500 text-sm mb-2'>{error}</div>}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='Email'
                      {...field}
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Password'
                      {...field}
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full'>
              Login
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

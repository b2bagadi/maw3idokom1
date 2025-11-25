"use client";

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        toast.success('Welcome, Super Admin!');
        router.push('/admin/dashboard');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-2xl animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-destructive to-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
            Super Admin Login
          </CardTitle>
          <CardDescription>
            Authorized access only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Username
              </Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Admin username"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Admin password"
                required
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-destructive to-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login as Super Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

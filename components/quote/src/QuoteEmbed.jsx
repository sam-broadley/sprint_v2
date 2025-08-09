import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@supabase/supabase-js';
import FileUpload from './components/FileUpload';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Select } from './components/ui/select';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

const QuoteEmbed = ({ storeSlug, supabaseUrl, supabaseAnonKey }) => {
  const [store, setStore] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  
  const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(
    supabaseUrl || process.env.REACT_APP_SUPABASE_URL,
    supabaseAnonKey || process.env.REACT_APP_SUPABASE_ANON_KEY
  ) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const uploadedFiles = watch('files') || [];

  useEffect(() => {
    const fetchStore = async () => {
      // If no Supabase client, use demo store data
      if (!supabase || !supabaseUrl || !supabaseAnonKey) {
        setStore({
          id: 1,
          name: 'Demo Store',
          slug: storeSlug || 'demo-store',
          branding: {
            primaryColor: '#3b82f6',
            accentColor: '#1d4ed8'
          },
          quote_settings: {
            notification_email: 'demo@example.com'
          }
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', storeSlug)
          .single();
        
        if (error) throw error;
        setStore(data);
      } catch (error) {
        console.error('Error fetching store:', error);
        // Fallback to demo store on error
        setStore({
          id: 1,
          name: 'Demo Store',
          slug: storeSlug || 'demo-store',
          branding: {
            primaryColor: '#3b82f6',
            accentColor: '#1d4ed8'
          },
          quote_settings: {
            notification_email: 'demo@example.com'
          }
        });
      }
    };

    fetchStore();
  }, [storeSlug, supabase, supabaseUrl, supabaseAnonKey]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // If no Supabase client, simulate success for demo
      if (!supabase) {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const orderNumber = `QUO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        console.log('Demo quote request:', {
          orderNumber,
          customer: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            company: data.company
          },
          enquiry: {
            productCategories: data.productCategories,
            decorationMethods: data.decorationMethods,
            printPlacements: data.printPlacements,
            quantities: data.quantities,
            turnaroundTime: data.turnaroundTime,
            budget: data.budget,
            designStatus: data.designStatus,
            additionalNotes: data.additionalNotes,
            uploadedFiles: uploadedFiles
          }
        });

        setSubmitMessage('Thank you! Your quote request has been submitted successfully. You will receive a response within 24-48 hours.');
        return;
      }

      // Call Supabase function to create quote
      const { data: result, error: functionError } = await supabase
        .rpc('create_quote_request', {
          store_slug_param: storeSlug,
          form_data: {
            ...data,
            uploadedFiles: uploadedFiles.map(file => ({
              name: file.name,
              url: file.url
            }))
          }
        });

      if (functionError) throw functionError;
      if (!result.success) throw new Error(result.error);

      setSubmitMessage('Thank you! Your quote request has been submitted successfully. You will receive a response within 24-48 hours.');
    } catch (error) {
      console.error('Error submitting quote request:', error);
      setSubmitMessage('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!store) {
    return <div className="p-4">Loading...</div>;
  }

  const branding = store.branding || {};
  const primaryColor = branding.primaryColor || '#000000';
  const accentColor = branding.accentColor || '#666666';

  return (
    <div 
      className="max-w-2xl mx-auto p-4"
      style={{
        '--primary': primaryColor,
        '--accent': accentColor,
      }}
    >
      <Card>
        <CardHeader>
          {store?.quote_settings?.form_config?.title && (
            <CardTitle style={{ color: primaryColor }}>
              {store.quote_settings.form_config.title}
            </CardTitle>
          )}
          {store?.quote_settings?.form_config?.subtitle && (
            <p className="text-sm text-gray-600">
              {store.quote_settings.form_config.subtitle}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(store?.quote_settings?.form_fields || [])
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((field) => {
                if (field.key === 'file_upload') {
                  return (
                    <div key={field.key}>
                      <Label>{field.label}</Label>
                      <FileUpload
                        onFilesChange={(files) => setValue('files', files)}
                        supabase={supabase}
                        storeId={store.id}
                        maxFiles={field.max_files || 5}
                        maxSize={(field.max_size_mb || 10) * 1024 * 1024}
                      />
                      {field.help_text && (
                        <p className="text-xs text-gray-500 mt-1">
                          {field.help_text}
                        </p>
                      )}
                    </div>
                  );
                }
                
                // Convert snake_case to camelCase for form registration
                const fieldName = field.key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                
                if (field.type === 'select') {
                  return (
                    <div key={field.key}>
                      <Label htmlFor={fieldName}>
                        {field.label} {field.required ? '*' : ''}
                      </Label>
                      <Select {...register(fieldName, { required: field.required ? `${field.label} is required` : false })}>
                        <option value="">{field.placeholder}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {errors[fieldName] && (
                        <p className="text-sm text-red-600">{errors[fieldName].message}</p>
                      )}
                    </div>
                  );
                }
                
                if (field.type === 'textarea') {
                  return (
                    <div key={field.key}>
                      <Label htmlFor={fieldName}>
                        {field.label} {field.required ? '*' : ''}
                      </Label>
                      <Textarea
                        id={fieldName}
                        rows={field.rows || 4}
                        placeholder={field.placeholder}
                        {...register(fieldName, { required: field.required ? `${field.label} is required` : false })}
                      />
                      {errors[fieldName] && (
                        <p className="text-sm text-red-600">{errors[fieldName].message}</p>
                      )}
                    </div>
                  );
                }
                
                // Default to input field
                return (
                  <div key={field.key} className={['first_name', 'last_name'].includes(field.key) ? 'md:col-span-1' : ''}>
                    <Label htmlFor={fieldName}>
                      {field.label} {field.required ? '*' : ''}
                    </Label>
                    <Input
                      id={fieldName}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      {...register(fieldName, { 
                        required: field.required ? `${field.label} is required` : false,
                        ...(field.type === 'email' && {
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Please enter a valid email'
                          }
                        })
                      })}
                    />
                    {errors[fieldName] && (
                      <p className="text-sm text-red-600">{errors[fieldName].message}</p>
                    )}
                  </div>
                );
              })}
            

            {store?.quote_settings?.form_config?.submit_button_text && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting 
                  ? (store?.quote_settings?.form_config?.submit_loading_text || store?.quote_settings?.form_config?.submit_button_text)
                  : store?.quote_settings?.form_config?.submit_button_text
                }
              </Button>
            )}

            {submitMessage && (
              <div className={`p-3 rounded-md text-sm ${
                submitMessage.includes('error') 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`}>
                {submitMessage}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteEmbed;
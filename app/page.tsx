"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle, Upload, User, Mail, Briefcase, FileText, Shield, Send, AlertCircle } from 'lucide-react';

interface FormData {
  username: string;
  email: string;
  position: string;
  files: File[];
  whyThisPosition: string;
  gdprConsent: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  position?: string;
  cv?: string;
  coverLetter?: string;
  gdprConsent?: string;
}

const translations = {
  pl: {
    usernameLabel: 'Nazwa użytkownika *',
    usernamePlaceholder: 'Wpisz nazwę użytkownika',
    emailLabel: 'Email *',
    emailPlaceholder: 'Wpisz adres e-mail',
    positionLabel: 'Stanowisko *',
    positionPlaceholder: 'Wybierz stanowisko',
    whyLabel: 'Dlaczego wybrałeś to stanowisko? (max. 1000 znaków)',
    whyPlaceholder: 'Opisz szczegółowo, dlaczego chcesz pracować na tym stanowisku i co możesz wnieść do zespołu...',
    filesLabel: 'Załącz pliki (zdjęcia, PDF, audio itp.) *',
    filesPlaceholder: 'Kliknij aby wybrać pliki',
    filesAddMore: 'Kliknij aby dodać kolejne pliki',
    gdprLabel: 'Wyrażam zgodę na przetwarzanie moich danych osobowych przez Klovy Chat w celu przeprowadzenia procesu rekrutacji zgodnie z RODO. Moje dane będą przechowywane przez okres niezbędny do realizacji procesu rekrutacji.',
    submit: 'Wyślij zgłoszenie',
    successTitle: 'Dziękujemy za zgłoszenie!',
    successText: 'Twoja aplikacja została pomyślnie wysłana. Skontaktujemy się z Tobą w ciągu 2-3 dni roboczych.',
    sendAnother: 'Wyślij kolejne zgłoszenie',
    contact: 'Masz pytania? Skontaktuj się z nami:',
    minCounter: 'max.',
    errorUsername: 'Nazwa użytkownika jest wymagana',
    errorEmail: 'Email jest wymagany',
    errorEmailInvalid: 'Podaj poprawny adres email',
    errorPosition: 'Wybierz stanowisko',
    errorFiles: 'Załącz przynajmniej jeden plik (zdjęcie, PDF, audio itp.)',
    errorWhy: 'Opisz szczegółowo, dlaczego wybrałeś to stanowisko',
    errorGdpr: 'Zgoda na przetwarzanie danych jest wymagana',
    errorSend: 'Wystąpił błąd podczas wysyłania formularza. Spróbuj ponownie.',
    personalData: 'Dane osobowe',
    applicationInfo: 'Informacje o aplikacji',
    gdprSection: 'Zgoda na przetwarzanie danych',
    joinKlovy: 'Dołącz do',
    formDescription: 'Wypełnij formularz aplikacyjny i rozpocznij swoją karierę z nami',
    maxFileSize: 'Maksymalny rozmiar pliku: 10MB',
    fileTooLarge: 'Jeden z plików jest za duży (max 10MB)',
    maxFiles: 'Możesz dodać maksymalnie 10 plików',
    removeFile: 'Usuń',
    sending: 'Wysyłanie...',
    other: 'Inne'
  },
  en: {
    usernameLabel: 'Username *',
    usernamePlaceholder: 'Enter your username',
    emailLabel: 'Email *',
    emailPlaceholder: 'Enter your email address',
    positionLabel: 'Position *',
    positionPlaceholder: 'Select position',
    whyLabel: 'Why did you choose this position? (max. 1000 characters)',
    whyPlaceholder: 'Describe in detail why you want to work in this position and what you can bring to the team...',
    filesLabel: 'Attach files (images, PDF, audio etc.) *',
    filesPlaceholder: 'Click to select files',
    filesAddMore: 'Click to add more files',
    gdprLabel: 'I consent to the processing of my personal data by Klovy Chat for the purpose of recruitment in accordance with GDPR. My data will be stored for the period necessary to complete the recruitment process.',
    submit: 'Submit application',
    successTitle: 'Thank you for your application!',
    successText: 'Your application has been sent successfully. We will contact you within 2-3 business days.',
    sendAnother: 'Send another application',
    contact: 'Questions? Contact us:',
    minCounter: 'max.',
    errorUsername: 'Username is required',
    errorEmail: 'Email is required',
    errorEmailInvalid: 'Enter a valid email address',
    errorPosition: 'Select a position',
    errorFiles: 'Attach at least one file (image, PDF, audio etc.)',
    errorWhy: 'Write in detail why you chose this position',
    errorGdpr: 'Consent to data processing is required',
    errorSend: 'An error occurred while submitting the form. Please try again.',
    personalData: 'Personal Data',
    applicationInfo: 'Application Information',
    gdprSection: 'Data Processing Consent',
    joinKlovy: 'Join',
    formDescription: 'Fill out the application form and start your career with us',
    maxFileSize: 'Maximum file size: 10MB',
    fileTooLarge: 'One of the files is too large (max 10MB)',
    maxFiles: 'You can add a maximum of 10 files',
    removeFile: 'Remove',
    sending: 'Sending...',
    other: 'Other'
  }
};

// Hook do zarządzania localStorage z SSR safety
const useLocalStorage = (key: string, initialValue: 'pl' | 'en') => {
  const [storedValue, setStoredValue] = useState<'pl' | 'en'>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(item as 'pl' | 'en');
      } else {
        // Fallback na język przeglądarki jeśli nie ma w localStorage
        const browserLang = navigator.language.toLowerCase();
        const detectedLang = browserLang.startsWith('pl') ? 'pl' : 'en';
        setStoredValue(detectedLang);
        window.localStorage.setItem(key, detectedLang);
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  const setValue = (value: 'pl' | 'en') => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue, isHydrated] as const;
};

export default function KlovyChatApplicationForm() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    position: '',
    files: [],
    whyThisPosition: '',
    gdprConsent: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lang, setLang, isHydrated] = useLocalStorage('preferred-language', 'pl');

  const t = translations[lang];

  // Global CSS injection for scrollbar styling
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Webkit browsers */
      ::-webkit-scrollbar {
        width: 12px;
      }
      ::-webkit-scrollbar-track {
        background: #e0e7ff;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background: #2563eb;
        border-radius: 10px;
        border: 2px solid #e0e7ff;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #1d4ed8;
      }
      /* Firefox */
      html {
        scrollbar-color: #2563eb #e0e7ff;
        scrollbar-width: thin;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Inject global CSS for placeholder color
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      input::placeholder, textarea::placeholder, select::placeholder {
        color: #6b7280 !important;
        font-weight: 400 !important;
        opacity: 1 !important;
      }
      input, textarea, select {
        color: #374151 !important;
        font-weight: 500 !important;
      }
      input:focus, textarea:focus, select:focus {
        color: #111827 !important;
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Pokaż loading lub domyślny język do momentu hydratacji
  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  // Remove a file from the selected files
  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
    if (errors.cv) {
      setErrors(prev => ({ ...prev, cv: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t.errorUsername;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.errorEmail;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.errorEmailInvalid;
    }

    if (!formData.position) {
      newErrors.position = t.errorPosition;
    }

    if (!formData.files || formData.files.length === 0) {
      newErrors.cv = t.errorFiles;
    }

    if (!formData.whyThisPosition.trim()) {
      newErrors.coverLetter = t.errorWhy;
    }

    if (!formData.gdprConsent) {
      newErrors.gdprConsent = t.errorGdpr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // Limit whyThisPosition to max 1000 chars
      if (name === 'whyThisPosition') {
        setFormData(prev => ({ ...prev, [name]: value.slice(0, 1000) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const tooBig = newFiles.some(f => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setErrors(prev => ({ ...prev, cv: t.fileTooLarge }));
      return;
    }
    // Combine existing files with new ones, but max 10
    setFormData(prev => {
      const combined = [...prev.files, ...newFiles].slice(0, 10);
      // If trying to add more than 10, show error
      if (prev.files.length + newFiles.length > 10) {
        setErrors(er => ({ ...er, cv: t.maxFiles }));
      } else if (errors.cv) {
        setErrors(er => ({ ...er, cv: undefined }));
      }
      return { ...prev, files: combined };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('whyThisPosition', formData.whyThisPosition);
      formDataToSend.append('gdprConsent', formData.gdprConsent.toString());
      formDataToSend.append('language', lang); // Dodaj język
      
      // Dodaj pliki
      formData.files.forEach((file, index) => {
        formDataToSend.append(`file${index + 1}`, file);
      });
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataToSend,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || t.errorSend);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ gdprConsent: error instanceof Error ? error.message : t.errorSend });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      position: '',
      files: [],
      whyThisPosition: '',
      gdprConsent: false
    });
    setErrors({});
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen py-8 px-4 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t.successTitle}
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t.successText}
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            {t.sendAnother}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t.joinKlovy} <span className="text-blue-600">Klovy Chat</span>
          </h1>
          <p className="text-lg text-gray-600">
            {t.formDescription}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-end items-center mb-6">
          <div className="relative flex bg-gray-100 rounded-full p-1 w-24 shadow-inner">
            <button
              type="button"
              onClick={() => setLang('pl')}
              className={`flex-1 py-2 px-3 rounded-full font-medium transition-all duration-300 text-sm z-10 relative ${
                lang === 'pl' ? 'text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              PL
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`flex-1 py-2 px-3 rounded-full font-medium transition-all duration-300 text-sm z-10 relative ${
                lang === 'en' ? 'text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              EN
            </button>
            <div
              className={`absolute top-1 left-1 bottom-1 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out shadow-md ${
                lang === 'en' ? 'translate-x-11' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {t.personalData}
            </h2>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t.usernameLabel}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.username ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder={t.usernamePlaceholder}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {t.emailLabel}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder={t.emailPlaceholder}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Application Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {t.applicationInfo}
            </h2>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                {t.positionLabel}
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.position ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                }`}
              >
                <option value="">{t.positionPlaceholder}</option>
                <option value="frontend-developer">Frontend Developer</option>
                <option value="backend-developer">Backend Developer</option>
                <option value="fullstack-developer">Fullstack Developer</option>
                <option value="mobile-developer">Mobile Developer</option>
                <option value="support-specialist">Support Specialist</option>
                <option value="cybersecurity-specialist">Cybersecurity Specialist</option>
                <option value="inne">{t.other}</option>
              </select>
              {errors.position && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.position}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Upload className="w-4 h-4" />
                {t.filesLabel}
              </label>
              
              {formData.files.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {formData.files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 px-2 py-1 text-xs text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                        aria-label={`${t.removeFile} ${file.name}`}
                      >
                        <AlertCircle className="w-4 h-4" /> {t.removeFile}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className={`border-2 border-dashed rounded-xl p-6 transition-colors duration-200 ${
                errors.cv ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input
                  type="file"
                  id="files"
                  name="files"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,audio/*"
                  multiple
                  className="hidden"
                />
                <label
                  htmlFor="files"
                  className="cursor-pointer flex flex-col items-center justify-center text-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {formData.files.length > 0
                      ? t.filesAddMore
                      : t.filesPlaceholder}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {t.maxFileSize}
                  </span>
                </label>
              </div>
              {errors.cv && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.cv}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="whyThisPosition" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {t.whyLabel}
              </label>
              <textarea
                id="whyThisPosition"
                name="whyThisPosition"
                value={formData.whyThisPosition}
                onChange={handleInputChange}
                rows={8}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none ${
                  errors.coverLetter ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder={t.whyPlaceholder}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.coverLetter && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.coverLetter}
                  </p>
                )}
                <span className="text-xs ml-auto text-gray-500">
                  {formData.whyThisPosition.length}/1000 {t.minCounter}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* GDPR Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {t.gdprSection}
            </h2>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <label htmlFor="gdprConsent" className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="gdprConsent"
                  name="gdprConsent"
                  checked={formData.gdprConsent}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {t.gdprLabel}
                </span>
              </label>
              {errors.gdprConsent && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gdprConsent}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.submit}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{t.contact} <a href="mailto:recruitment@klovy.org" className="text-blue-600 hover:underline">recruitment@klovy.org</a></p>
        </div>
      </div>
    </main>
  );
}
import { NextRequest, NextResponse } from 'next/server';

// Tłumaczenia dla emaili
const translations = {
  pl: {
    newApplication: 'Nowa aplikacja rekrutacyjna',
    username: 'Nazwa użytkownika',
    email: 'Email',
    position: 'Stanowisko',
    whyPosition: 'Dlaczego wybrałem to stanowisko',
    gdprConsent: 'Zgoda RODO',
    sentDate: 'Data wysłania',
    yes: 'TAK',
    no: 'NIE',
    allFieldsRequired: 'Wszystkie pola są wymagane',
    invalidEmail: 'Nieprawidłowy format adresu email',
    fileTooLarge: 'Rozmiar pliku nie może przekraczać 10MB',
    smtpError: 'Błąd konfiguracji serwera email',
    successMessage: 'Aplikacja została pomyślnie wysłana',
    serverError: 'Błąd serwera podczas wysyłania aplikacji',
    subjectLine: 'Nowa aplikacja na stanowisko'
  },
  en: {
    newApplication: 'New job application',
    username: 'Username',
    email: 'Email',
    position: 'Position',
    whyPosition: 'Why I chose this position',
    gdprConsent: 'GDPR Consent',
    sentDate: 'Sent date',
    yes: 'YES',
    no: 'NO',
    allFieldsRequired: 'All fields are required',
    invalidEmail: 'Invalid email format',
    fileTooLarge: 'File size cannot exceed 10MB',
    smtpError: 'Email server configuration error',
    successMessage: 'Application sent successfully',
    serverError: 'Server error while sending application',
    subjectLine: 'New application for position'
  }
};

export async function POST(req: NextRequest) {
  console.log('=== API Route Started ===');
  
  try {
    const data = await req.formData();
    console.log('Form data received');
   
    // Wyciągnij dane z formularza
  const username = data.get('username') as string;
  const email = data.get('email') as string;
  const position = data.get('position') as string;
  const whyThisPosition = data.get('whyThisPosition') as string;
  const gdprConsent = data.get('gdprConsent') === 'true';
  const language = (data.get('language') as string) || 'pl';
  const turnstileToken = data.get('turnstileToken') as string;
    // Weryfikacja Cloudflare Turnstile
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Brak tokena CAPTCHA' }, { status: 400 });
    }
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.CF_TURNSTILE_SECRET_KEY}&response=${turnstileToken}`
    });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      return NextResponse.json({ error: 'Weryfikacja CAPTCHA nie powiodła się' }, { status: 400 });
    }
   
    console.log('Extracted data:', { username, email, position, gdprConsent, language });
   
    // Wybierz odpowiednie tłumaczenia
    const t = translations[language as keyof typeof translations] || translations.pl;
   
    // Pobierz wszystkie pliki
    const files: File[] = [];
    for (let i = 1; ; i++) {
      const file = data.get(`file${i}`);
      if (!file) break;
      files.push(file as File);
    }
    
    console.log(`Found ${files.length} files`);
   
    // Walidacja po stronie serwera
    if (!username || !email || !position || !whyThisPosition || !gdprConsent || files.length === 0) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: t.allFieldsRequired },
        { status: 400 }
      );
    }
    
    // Dodatkowa walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email validation failed');
      return NextResponse.json(
        { error: t.invalidEmail },
        { status: 400 }
      );
    }
    
    // Sprawdź rozmiar plików (max 10MB na plik)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxFileSize) {
        console.log(`File too large: ${file.name} (${file.size} bytes)`);
        return NextResponse.json(
          { error: t.fileTooLarge },
          { status: 400 }
        );
      }
    }

    // Sprawdź EMAIL_PASSWORD - dokładnie jak w komunikatorze
    if (!process.env.EMAIL_PASSWORD) {
      console.error('EMAIL_PASSWORD environment variable is required but not provided');
      return NextResponse.json(
        { error: 'Missing EMAIL_PASSWORD configuration' },
        { status: 500 }
      );
    }
   
    // Importuj nodemailer
    const nodemailer = require('nodemailer');
    
    // Konfiguracja SMTP - DOKŁADNIE JAK W KOMUNIKATORZE
    const transporter = nodemailer.createTransport({
      host: "mail1.titanaxe.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@klovy.org",
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    console.log('Transporter created, verifying connection...');
    
    // Weryfikacja połączenia SMTP
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { 
          error: t.smtpError,
          details: verifyError instanceof Error ? verifyError.message : String(verifyError)
        },
        { status: 500 }
      );
    }
   
    // Formatowanie daty
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
    const formattedDate = new Date().toLocaleString(locale, dateOptions);
   
    // Przygotuj załączniki
    console.log('Preparing attachments...');
    const attachments = await Promise.all(
      files.map(async (file, index) => {
        console.log(`Processing file ${index + 1}: ${file.name} (${file.size} bytes)`);
        return {
          filename: file.name,
          content: Buffer.from(await file.arrayBuffer()),
        };
      })
    );
    console.log(`${attachments.length} attachments prepared`);
   
    // Treść maila - format jak w komunikatorze
    const mailOptions = {
      from: 'Formularz Rekrutacyjny - Klovy Chat <support@klovy.org>',
      to: process.env.RECRUITMENT_EMAIL || 'recruitment@klovy.org',
      subject: `${t.subjectLine}: ${position}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${t.newApplication}</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${t.username}:</strong> ${username}</p>
            <p><strong>${t.email}:</strong> ${email}</p>
            <p><strong>${t.position}:</strong> ${position}</p>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>${t.whyPosition}:</strong></p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              ${whyThisPosition.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p><strong>${t.gdprConsent}:</strong> ${gdprConsent ? t.yes : t.no}</p>
          <hr style="border: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px;">
            ${t.sentDate}: ${formattedDate}<br>
            Language: ${language.toUpperCase()}<br>
            Plików załączonych: ${files.length}
          </p>
        </div>
      `,
      attachments: attachments,
    };
   
    console.log('Mail options prepared, sending email...');
   
    // Wyślij maila
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
      
      return NextResponse.json({
        success: true,
        message: t.successMessage
      });
    } catch (mailError) {
      console.error('Email sending failed:', mailError);
      
      return NextResponse.json({
        error: t.smtpError,
        details: mailError instanceof Error ? mailError.message : String(mailError)
      }, { status: 500 });
    }
   
  } catch (error) {
    console.error('=== API Route Error ===');
    console.error('Error processing application:', error);
    
    const language = 'pl'; // fallback
    const t = translations[language];
    
    return NextResponse.json(
      { 
        error: t.serverError,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemedToaster } from "@/components/themed-toaster";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  MODES,
  STORAGE_KEY,
  THEME_IDS,
} from "@/lib/themes";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "ChatFlyr — Official WhatsApp Business API Platform | CRM, Automation & Bulk Messaging",
    template: "%s | ChatFlyr",
  },
  description:
    "ChatFlyr is India's leading WhatsApp Business API platform. Send bulk WhatsApp messages, automate conversations with AI chatbots, manage contacts with CRM, build message templates, and grow your business. Official Meta partner offering WhatsApp API, website development, app development, AI automation, and digital marketing solutions in Lucknow, Delhi, Mumbai, Bangalore, Hyderabad, Pune, Noida, Gurgaon, Kolkata & Chennai.",
  keywords: [
    // Core Product
    "ChatFlyr", "WhatsApp API", "WhatsApp Business API", "WhatsApp Automation",
    "WhatsApp Marketing", "WhatsApp Chatbot", "WhatsApp CRM",
    "Bulk WhatsApp Messaging", "WhatsApp Broadcast",
    // Website Development
    "Website Development", "Web Development", "Website Design", "Business Website",
    "Ecommerce Website", "WordPress Development",
    // App Development
    "App Development", "Mobile App Development", "Android App Development",
    "iOS App Development", "React Native App Development", "Ecommerce App",
    // CRM
    "CRM Software", "Custom CRM", "Business CRM", "Lead Management",
    "Sales CRM", "Customer Management",
    // Software & AI
    "Custom Software", "SaaS Development", "Software Development",
    "Business Automation", "AI Automation", "AI Chatbot", "AI Solutions",
    "API Integration",
    // Digital Marketing
    "Digital Marketing", "SEO Services", "Social Media Marketing",
    "Meta Ads", "Google Ads",
    // Other Services
    "UI UX Design", "Cloud Solutions", "Payment Gateway Integration",
    "Business Technology Solutions", "Digital Solutions",
    // Location: Lucknow
    "WhatsApp API Provider in Lucknow", "Website Development Company in Lucknow",
    "Mobile App Development Company in Lucknow", "CRM Software Company in Lucknow",
    "Software Development Company in Lucknow", "AI Automation Company in Lucknow",
    "Digital Marketing Company in Lucknow",
    // Location: Delhi
    "WhatsApp API Provider in Delhi", "Website Development Company in Delhi",
    "Mobile App Development Company in Delhi", "CRM Software Company in Delhi",
    "Software Development Company in Delhi", "AI Automation Company in Delhi",
    "Digital Marketing Company in Delhi",
    // Location: Mumbai
    "WhatsApp API Provider in Mumbai", "Website Development Company in Mumbai",
    "Mobile App Development Company in Mumbai", "CRM Software Company in Mumbai",
    "Software Development Company in Mumbai", "AI Automation Company in Mumbai",
    "Digital Marketing Company in Mumbai",
    // Location: Bangalore
    "WhatsApp API Provider in Bangalore", "Website Development Company in Bangalore",
    "Mobile App Development Company in Bangalore", "CRM Software Company in Bangalore",
    "Software Development Company in Bangalore", "AI Automation Company in Bangalore",
    "Digital Marketing Company in Bangalore",
    // Location: Hyderabad
    "WhatsApp API Provider in Hyderabad", "Website Development Company in Hyderabad",
    "Mobile App Development Company in Hyderabad", "CRM Software Company in Hyderabad",
    "Software Development Company in Hyderabad", "AI Automation Company in Hyderabad",
    "Digital Marketing Company in Hyderabad",
    // Location: Pune
    "WhatsApp API Provider in Pune", "Website Development Company in Pune",
    "Mobile App Development Company in Pune", "CRM Software Company in Pune",
    "Software Development Company in Pune", "AI Automation Company in Pune",
    "Digital Marketing Company in Pune",
    // Location: Noida
    "WhatsApp API Provider in Noida", "Website Development Company in Noida",
    "Mobile App Development Company in Noida", "CRM Software Company in Noida",
    "Software Development Company in Noida", "AI Automation Company in Noida",
    "Digital Marketing Company in Noida",
    // Location: Gurgaon
    "WhatsApp API Provider in Gurgaon", "Website Development Company in Gurgaon",
    "Mobile App Development Company in Gurgaon", "CRM Software Company in Gurgaon",
    "Software Development Company in Gurgaon", "AI Automation Company in Gurgaon",
    "Digital Marketing Company in Gurgaon",
    // Location: Kolkata
    "WhatsApp API Provider in Kolkata", "Website Development Company in Kolkata",
    "Mobile App Development Company in Kolkata", "CRM Software Company in Kolkata",
    "Software Development Company in Kolkata", "AI Automation Company in Kolkata",
    "Digital Marketing Company in Kolkata",
    // Location: Chennai
    "WhatsApp API Provider in Chennai", "Website Development Company in Chennai",
    "Mobile App Development Company in Chennai", "CRM Software Company in Chennai",
    "Software Development Company in Chennai", "AI Automation Company in Chennai",
    "Digital Marketing Company in Chennai",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "ChatFlyr",
    title: "ChatFlyr — Official WhatsApp Business API Platform",
    description:
      "Send bulk WhatsApp messages, automate with AI chatbots, manage contacts with CRM. Official Meta partner for WhatsApp API, website development, app development & digital marketing.",
    images: [{ url: "/chatflyr-logo.png", width: 1200, height: 630, alt: "ChatFlyr - WhatsApp Business API Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatFlyr — Official WhatsApp Business API Platform",
    description:
      "India's leading WhatsApp API platform. Bulk messaging, AI chatbots, CRM, automation & more.",
    images: ["/chatflyr-logo.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark light",
};

// Inline boot script — runs before React hydrates so the user's
// chosen accent (data-theme) AND mode (data-mode) are on the <html>
// element before first paint. Without this every page load flashes
// the server-rendered defaults for a frame before the React tree
// mounts and applies the picked values.
//
// Kept dependency-free (no imports, no JSX) — must be a string the
// browser can run as a single <script>. Knowledge of valid ids is
// sourced from the THEME_IDS / MODES constants so adding one doesn't
// silently break the boot path.
const THEME_BOOT_SCRIPT = `
(function(){
  var d = document.documentElement;
  try {
    var THEME_KEY = ${JSON.stringify(STORAGE_KEY)};
    var THEME_DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var THEMES = ${JSON.stringify(THEME_IDS)};
    var savedTheme = localStorage.getItem(THEME_KEY);
    d.dataset.theme = THEMES.indexOf(savedTheme) !== -1 ? savedTheme : THEME_DEFAULT;

    var MODE_KEY = ${JSON.stringify(MODE_STORAGE_KEY)};
    var MODE_DEFAULT = ${JSON.stringify(DEFAULT_MODE)};
    var MODES = ${JSON.stringify(MODES)};
    var savedMode = localStorage.getItem(MODE_KEY);
    d.dataset.mode = MODES.indexOf(savedMode) !== -1 ? savedMode : MODE_DEFAULT;
  } catch (_e) {
    d.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
    d.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      data-mode={DEFAULT_MODE}
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
      // The `theme-boot` script below rewrites `data-theme` and
      // `data-mode` on <html> from localStorage before React hydrates,
      // so for any non-default choice the client DOM intentionally
      // differs from the server-rendered defaults. suppressHydration-
      // Warning silences the expected mismatch — it only applies to
      // this element's own attributes, so genuine mismatches in
      // children still surface.
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script id="theme-boot" suppressHydrationWarning>
          {THEME_BOOT_SCRIPT}
        </script>
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
            <ThemedToaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

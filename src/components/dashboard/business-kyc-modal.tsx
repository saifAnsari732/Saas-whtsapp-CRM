'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileText,
  BadgeCheck,
  TrendingUp,
  RefreshCw,
  Eye,
  Check,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Clock,
  Layers,
  FileQuestion,
  XCircle,
  FileUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadAccountMedia } from '@/lib/storage/upload-media';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BusinessKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  metaVerificationStatus?: string;
  wabaId?: string;
  verifiedName?: string;
  displayPhone?: string;
  qualityRating?: string;
  onRefresh?: () => void;
}

export function BusinessKYCModal({
  isOpen,
  onClose,
  metaVerificationStatus = 'not_verified',
  wabaId,
  verifiedName,
  displayPhone,
  qualityRating,
  onRefresh,
}: BusinessKYCModalProps) {
  const isMetaVerified = metaVerificationStatus?.toLowerCase() === 'verified';
  const [activeTab, setActiveTab] = useState<'form' | 'guide'>('form');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddressDetails, setShowAddressDetails] = useState(false);

  // Form State
  const [legalName, setLegalName] = useState('');
  const [businessType, setBusinessType] = useState('proprietorship');
  const [documentType, setDocumentType] = useState('gst_certificate');
  const [documentNumber, setDocumentNumber] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Upload & Submission State
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');
  const [documentFileSize, setDocumentFileSize] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompleted =
    isMetaVerified ||
    existingSubmission?.status === 'completed' ||
    existingSubmission?.status === 'verified';

  useEffect(() => {
    if (isOpen) {
      loadKycData();
    }
  }, [isOpen]);

  async function loadKycData() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/kyc');
      if (res.ok) {
        const data = await res.json();
        if (data.meta_status) {
          setMetaStatus(data.meta_status);
        }
        if (data.submission) {
          setExistingSubmission(data.submission);
          setLegalName(data.submission.legal_business_name || '');
          setBusinessType(data.submission.business_type || 'proprietorship');
          setDocumentType(data.submission.document_type || 'gst_certificate');
          setDocumentNumber(data.submission.document_number || '');
          setOfficialEmail(data.submission.official_email || '');
          setOfficialWebsite(data.submission.official_website || '');
          setAddress(data.submission.address || '');
          setCity(data.submission.city || '');
          setState(data.submission.state || '');
          setPincode(data.submission.pincode || '');
          setDocumentUrl(data.submission.document_file_url || '');
          if (data.submission.document_file_url) {
            setDocumentFileName('Business-Registration-Certificate.pdf');
          }
          if (data.submission.address || data.submission.city || data.submission.official_email) {
            setShowAddressDetails(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load existing KYC:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  async function processFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    try {
      setIsUploading(true);
      setDocumentFileName(file.name);
      setDocumentFileSize(formatBytes(file.size));
      toast.info('Uploading document securely...');
      const { publicUrl } = await uploadAccountMedia('chat-media', file);
      setDocumentUrl(publicUrl);
      toast.success('Document uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameToSubmit = legalName.trim() || metaStatus?.verified_name || verifiedName || '';
    if (!nameToSubmit) {
      toast.error('Please enter your Legal Business Name');
      return;
    }
    if (!documentUrl.trim()) {
      toast.error('Please upload your business document (GST/Certificate/MSME)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/whatsapp/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_business_name: nameToSubmit,
          business_type: businessType,
          document_type: documentType,
          document_number: documentNumber,
          official_email: officialEmail,
          official_website: officialWebsite,
          address,
          city,
          state,
          pincode,
          document_file_url: documentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit KYC');
      }

      toast.success('KYC documents submitted successfully! Review is in progress.');
      setExistingSubmission(data.record);
      setShowEditForm(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const effectiveBusinessName =
    metaStatus?.verified_name ||
    verifiedName ||
    existingSubmission?.legal_business_name ||
    legalName ||
    'Official WhatsApp Business';

  const effectiveDisplayPhone =
    metaStatus?.display_phone_number || displayPhone || '+91 95114 50924';

  const effectiveQuality =
    metaStatus?.quality_rating || qualityRating || 'High (GREEN)';

  const effectiveWabaId =
    metaStatus?.waba_id || wabaId || '1582491960587265';

  const effectiveDocNumber =
    existingSubmission?.document_number || documentNumber || '';

  const effectiveAddress = [
    existingSubmission?.address || address,
    existingSubmission?.city || city,
    existingSubmission?.state || state,
    existingSubmission?.pincode || pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl lg:max-w-4xl w-[95vw] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl text-foreground"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-5 sm:px-8 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Business Verification & Limits
                </DialogTitle>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <Check className="h-3 w-3 stroke-[3]" />
                    Tier 1 (2,000 / Day)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <Clock className="h-3 w-3" />
                    Sandbox (250 / Day)
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Scale your WhatsApp outbound messaging limit from 250 to 2,000+ conversations per day.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://business.facebook.com/settings/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-accent text-xs font-medium text-foreground transition-colors shadow-2xs"
            >
              <span>Meta Security Center</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-6">
          {/* Milestone Tier Pathway Roadmap */}
          <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-card shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">
                Messaging Limit Milestones
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Meta Scaling Pathway
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Sandbox */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  !isCompleted
                    ? 'border-amber-500/40 bg-amber-500/[0.04]'
                    : 'border-border/60 bg-muted/20 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground">Tier 0 (Sandbox)</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      !isCompleted ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="text-base font-bold text-foreground mt-1">250 / Day</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Default starter tier for new WABA accounts
                </p>
              </div>

              {/* Step 2: Verified (Target) */}
              <div
                className={`p-3 rounded-xl border transition-all relative ${
                  isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/[0.06] shadow-xs'
                    : 'border-emerald-500/30 bg-emerald-500/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Tier 1 (Verified)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    Target
                  </span>
                </div>
                <div className="text-base font-bold text-foreground mt-1 flex items-center gap-1.5">
                  <span>2,000 / Day</span>
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Unlocked instantly with 1 valid business document
                </p>
              </div>

              {/* Step 3: High Scale */}
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-muted-foreground">Tier 2 (Enterprise)</span>
                  <span className="text-[10px] text-muted-foreground">Auto-Scales</span>
                </div>
                <div className="text-base font-bold text-foreground mt-1">10,000+ / Day</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Scales automatically as campaigns maintain high quality
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="inline-flex p-1 rounded-xl bg-muted/40 border border-border/60 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Verification Form</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'guide'
                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Accepted Documents Guide</span>
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Syncing Meta Graph API...</span>
              </div>
            )}
          </div>

          {/* TAB 1: FORM OR COMPLETED VIEW */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              {/* If Completed and Not Editing: Showcase Verified Record */}
              {isCompleted && !showEditForm ? (
                <div className="space-y-5">
                  <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <BadgeCheck className="h-6 w-6 stroke-[2]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            <span>Official Verified Business</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Verified on Meta WhatsApp Cloud API v21.0
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditForm(true)}
                        className="rounded-xl text-xs font-semibold h-8 gap-1.5 shrink-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Update Documents
                      </Button>
                    </div>

                    {/* Verified Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2">
                        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Business Profile
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {effectiveBusinessName}
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                          <span>Phone:</span>
                          <span className="font-mono font-semibold text-foreground">
                            {effectiveDisplayPhone}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Quality Rating:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {effectiveQuality}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2">
                        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Messaging Capacity
                        </div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          2,000 daily conversations
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                          <span>Document Type:</span>
                          <span className="font-medium text-foreground capitalize">
                            {(existingSubmission?.document_type || documentType).replace(/_/g, ' ')}
                          </span>
                        </div>
                        {effectiveDocNumber && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Registration No:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {effectiveDocNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Document Download / View */}
                      {existingSubmission?.document_file_url && (
                        <div className="sm:col-span-2 p-3.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div className="truncate text-xs">
                              <div className="font-semibold text-foreground truncate">
                                Business-Registration-Certificate.pdf
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Verified document on file
                              </div>
                            </div>
                          </div>
                          <a
                            href={existingSubmission.document_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Document</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* The Easy, Clean Form Flow */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Header Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {showEditForm ? 'Update Verification Documents' : 'Submit Business KYC Documents'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Provide your registered business details and upload 1 government certificate.
                      </p>
                    </div>

                    {showEditForm && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditForm(false)}
                        className="text-xs h-8 text-muted-foreground"
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>

                  {/* Main 2-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left Column: Business Details */}
                    <div className="space-y-4">
                      {/* Legal Business Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Legal Business Name <span className="text-rose-500">*</span></span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            As per certificate
                          </span>
                        </Label>
                        <Input
                          placeholder="e.g. Kisan Choice Agro Pvt Ltd"
                          value={legalName || verifiedName || ''}
                          onChange={(e) => setLegalName(e.target.value)}
                          className="h-10 text-xs rounded-xl bg-card border-border/80 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                          required
                        />
                      </div>

                      {/* Business Entity Type & Document Proof Type */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">Entity Type</Label>
                          <Select
                            value={businessType}
                            onValueChange={(val) => val && setBusinessType(val)}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-card border-border/80">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="proprietorship" className="text-xs">
                                Sole Proprietorship
                              </SelectItem>
                              <SelectItem value="partnership" className="text-xs">
                                Partnership Firm
                              </SelectItem>
                              <SelectItem value="private_limited" className="text-xs">
                                Private Limited (Pvt Ltd)
                              </SelectItem>
                              <SelectItem value="public_limited" className="text-xs">
                                Public Limited
                              </SelectItem>
                              <SelectItem value="llp" className="text-xs">
                                LLP
                              </SelectItem>
                              <SelectItem value="msme" className="text-xs">
                                MSME Enterprise
                              </SelectItem>
                              <SelectItem value="registered_business" className="text-xs">
                                Other Entity
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">
                            Proof Type
                          </Label>
                          <Select
                            value={documentType}
                            onValueChange={(val) => val && setDocumentType(val)}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-card border-border/80">
                              <SelectValue placeholder="Select proof" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="gst_certificate" className="text-xs">
                                GST Certificate (Fastest)
                              </SelectItem>
                              <SelectItem value="udyam_msme" className="text-xs">
                                MSME Udyam
                              </SelectItem>
                              <SelectItem value="certificate_of_incorporation" className="text-xs">
                                Incorporation (CIN)
                              </SelectItem>
                              <SelectItem value="trade_license" className="text-xs">
                                Trade License / Gumasta
                              </SelectItem>
                              <SelectItem value="bank_statement" className="text-xs">
                                Bank Statement (Current)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Registration / GSTIN Number */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Registration / GSTIN Number</span>
                          <span className="text-[11px] text-muted-foreground font-normal">
                            Optional
                          </span>
                        </Label>
                        <Input
                          placeholder="e.g. 09ABCDE1234F1Z5 or UDYAM-UP-00-1234567"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          className="h-10 text-xs font-mono rounded-xl bg-card border-border/80 uppercase focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Right Column: Clean Certificate Upload Dropzone */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>
                          Business Document Certificate <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          Max 10MB
                        </span>
                      </Label>

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                      />

                      {documentUrl ? (
                        /* Uploaded State Card */
                        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.04] space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 truncate">
                              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="truncate text-xs">
                                <div className="font-semibold text-foreground truncate">
                                  {documentFileName || 'Business-Certificate.pdf'}
                                </div>
                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                  <span>Document ready to verify</span>
                                  {documentFileSize && <span>• {documentFileSize}</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-500/20">
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              Preview
                            </a>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="rounded-lg h-7 text-xs font-medium border-border"
                            >
                              {isUploading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Replace
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Interactive Dropzone */
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`cursor-pointer group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all text-center space-y-2.5 ${
                            isDragging
                              ? 'border-emerald-500 bg-emerald-500/[0.08]'
                              : 'border-border/80 hover:border-emerald-500/60 bg-muted/15 hover:bg-emerald-500/[0.02]'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {isUploading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <UploadCloud className="h-5 w-5 stroke-[2]" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {isUploading ? 'Uploading file...' : 'Click or drag & drop certificate here'}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              GST Certificate, MSME Udyam, Trade License, or CIN (PDF, PNG, JPG)
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                            Up to 10 MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Optional Contact & Address */}
                  <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setShowAddressDetails(!showAddressDetails)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Official Address & Contact Details</span>
                        <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
                      </span>
                      {showAddressDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {showAddressDetails && (
                      <div className="p-4 pt-2 border-t border-border/50 space-y-3 animate-in fade-in-50 duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">
                              Official Business Email
                            </Label>
                            <Input
                              type="email"
                              placeholder="support@yourcompany.com"
                              value={officialEmail}
                              onChange={(e) => setOfficialEmail(e.target.value)}
                              className="h-9 text-xs rounded-lg bg-card border-border/80"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">
                              Registered Address
                            </Label>
                            <Input
                              placeholder="Address as printed on certificate"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="h-9 text-xs rounded-lg bg-card border-border/80"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">City</Label>
                            <Input
                              placeholder="e.g. Lucknow"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="h-9 text-xs rounded-lg bg-card border-border/80"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">State</Label>
                            <Input
                              placeholder="e.g. Uttar Pradesh"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="h-9 text-xs rounded-lg bg-card border-border/80"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-foreground">Pincode</Label>
                            <Input
                              placeholder="6-digit PIN"
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                              maxLength={6}
                              className="h-9 text-xs font-mono rounded-lg bg-card border-border/80"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clean Approval Hint */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] flex items-start gap-2.5 text-xs">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Pro-Tip for Fast 24h Approval:</strong> Indian businesses uploading their <strong>GST Registration (Form REG-06)</strong> or <strong>MSME Udyam Certificate</strong> receive automated expedited verification on Meta.
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: ACCEPTED DOCUMENTS GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Meta Official Accepted Business Documents</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Meta requires 1 valid government-issued proof of business identity to scale your account.
                </p>
              </div>

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. GST */}
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-card shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      ★ #1 Recommended
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">2-6 Hrs Approval</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span>GST Registration (REG-06)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Official GST certificate showing Legal Name, Trade Name, GSTIN, and Principal Place of Business.
                  </p>
                  <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    ✓ Highest Meta approval rate
                  </div>
                </div>

                {/* 2. MSME Udyam */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400">
                      MSME Govt
                    </span>
                    <span className="text-[11px] text-muted-foreground">Fast Track</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Udyam Registration</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Udyam Registration Certificate issued by Ministry of MSME with URN and business address.
                  </p>
                  <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                    ✓ Ideal for small businesses & traders
                  </div>
                </div>

                {/* 3. Certificate of Incorporation */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400">
                      MCA / ROC
                    </span>
                    <span className="text-[11px] text-muted-foreground">Corporates</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                    <span>Incorporation (CIN)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Certificate of Incorporation issued by Ministry of Corporate Affairs for Pvt Ltd and LLPs.
                  </p>
                  <div className="text-[10px] font-medium text-purple-700 dark:text-purple-400">
                    ✓ Required for Pvt Ltd companies
                  </div>
                </div>

                {/* 4. Trade License */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      Municipal
                    </span>
                    <span className="text-[11px] text-muted-foreground">Local Govt</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-amber-600" />
                    <span>Shop & Trade License</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Shop & Establishment / Gumasta License issued by Municipal Corporation or State Labour Dept.
                  </p>
                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                    ✓ Valid for retail & local establishments
                  </div>
                </div>

                {/* 5. Business Bank Statement */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300">
                      Financial
                    </span>
                    <span className="text-[11px] text-muted-foreground">&lt; 3 Months</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                    <span>Current Bank Statement</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Official 3-month current account statement showing company name, address, and bank seal.
                  </p>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    ✓ Bank stamp/seal required
                  </div>
                </div>

                {/* 6. Utility Bill */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300">
                      Utility
                    </span>
                    <span className="text-[11px] text-muted-foreground">Recent</span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    <span>Commercial Utility Bill</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Electricity, broadband, or landline bill in the exact registered business name (under 90 days).
                  </p>
                  <div className="text-[10px] font-medium text-teal-700 dark:text-teal-300">
                    ✓ Company name mandatory
                  </div>
                </div>
              </div>

              {/* Best Practices Checklists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] space-y-1.5">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Recommended for Approval:</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>High-resolution scan or photo showing all 4 document corners.</li>
                    <li>Business name exactly matches your WhatsApp display name.</li>
                    <li>File size under 10MB in PDF, JPG, or PNG.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.03] space-y-1.5">
                  <div className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Common Rejections to Avoid:</span>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Personal Aadhaar Card or personal PAN without business certificate.</li>
                    <li>Handwritten receipts, invoices, or business cards.</li>
                    <li>Blurry or cropped photos where registration numbers are unreadable.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card">
                <span className="text-xs text-muted-foreground">
                  Ready to upload your verified document?
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    setActiveTab('form');
                    setShowEditForm(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-8 px-4 gap-1.5 shadow-2xs"
                >
                  <span>Upload Document</span>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer Bar */}
        <div className="px-6 py-4 sm:px-8 border-t border-border/70 bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Encrypted & verified in compliance with Meta Cloud API guidelines</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-9 px-4 text-xs font-medium border-border/80"
            >
              {isCompleted && !showEditForm ? 'Close' : 'Cancel'}
            </Button>

            {(!isCompleted || showEditForm) && activeTab === 'form' && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-5 text-xs font-semibold shadow-xs hover:shadow-sm gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Submit for Meta Scaling</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

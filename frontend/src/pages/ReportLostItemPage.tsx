import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Sparkles, Wand2, MapPin, Tag, Phone, FileText } from 'lucide-react';
import { lostItemsApi, aiApi } from '../lib/api';
import PageTransition from '../components/PageTransition';
import ImageUploader from '../components/ImageUploader';
import LocationPickerInput from '../components/LocationPickerInput';

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

type FormData = {
  itemName: string;
  category: string;
  description: string;
  lostDate: string;
  lostTime?: string;
  lostLocation: string;
  color?: string;
  brand?: string;
  additionalNotes?: string;
  contactNumber: string;
  rewardAmount: number;
};

const labelCls = 'block text-xs font-bold uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-200';

export default function ReportLostItemPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [enhancing, setEnhancing] = useState(false);
  const [existingImagePublicIds, setExistingImagePublicIds] = useState<string[]>([]);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      itemName: '',
      category: 'Electronics',
      description: '',
      lostDate: new Date().toISOString().split('T')[0],
      lostTime: '',
      lostLocation: 'Central Library',
      color: '',
      brand: '',
      additionalNotes: '',
      contactNumber: '',
      rewardAmount: '' as unknown as number,
    },
  });

  const watchAll = watch();

  const qualityScore = Math.min(
    100,
    (watchAll.itemName ? 20 : 0) +
      (watchAll.category ? 15 : 0) +
      (watchAll.description && watchAll.description.length > 15 ? 25 : 10) +
      (watchAll.lostLocation ? 15 : 0) +
      (watchAll.contactNumber ? 15 : 0) +
      (displayedImages.length > 0 ? 10 : 0)
  );

  useEffect(() => {
    if (!isEdit) return;
    const fetchItem = async () => {
      try {
        const res = await lostItemsApi.getById(id!);
        const { item } = res.data;
        setValue('itemName', item.itemName);
        setValue('category', item.category);
        setValue('description', item.description);
        setValue('lostDate', new Date(item.lostDate).toISOString().split('T')[0]);
        setValue('lostTime', item.lostTime || '');
        setValue('lostLocation', item.lostLocation);
        setValue('color', item.color || '');
        setValue('brand', item.brand || '');
        setValue('additionalNotes', item.additionalNotes || '');
        setValue('contactNumber', item.contactNumber);
        setValue('rewardAmount', item.rewardAmount ?? ('' as unknown as number));

        const loadedUrls = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
        const loadedPublicIds = item.imagePublicIds?.length ? item.imagePublicIds : item.imagePublicId ? [item.imagePublicId] : [];
        setExistingImagePublicIds(loadedPublicIds);
        setDisplayedImages(loadedUrls);
      } catch {
        toast.error('Failed to load lost item details.');
      }
    };
    fetchItem();
  }, [id, isEdit, setValue]);

  const handleEnhanceDescription = async () => {
    const itemName = getValues('itemName');
    const category = getValues('category');
    const description = getValues('description');
    const location = getValues('lostLocation');
    const brand = getValues('brand');
    const color = getValues('color');

    if (!itemName || !description) {
      toast.error('Please fill in Item Title and a brief Description first.');
      return;
    }

    setEnhancing(true);
    try {
      const res = await aiApi.enhanceDescription({ itemName, category, description, location, brand, color });
      if (res.data?.enhancedDescription) {
        setValue('description', res.data.enhancedDescription);
        toast.success('Description enhanced with AI!');
      }
    } catch {
      toast.error('Could not enhance description. Please try again.');
    } finally {
      setEnhancing(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const val = (data as any)[key];
        if (key === 'rewardAmount') {
          const num = Number(val);
          formData.append('rewardAmount', (!Number.isNaN(num) && num > 0) ? String(num) : '0');
        } else if (val !== undefined && val !== null && val !== '') {
          formData.append(key, val);
        }
      });

      const remoteUrls = displayedImages.filter((img) => img.startsWith('http://') || img.startsWith('https://'));
      if (remoteUrls.length > 0) {
        formData.append('existingImageUrls', JSON.stringify(remoteUrls));
        formData.append('existingImagePublicIds', JSON.stringify(existingImagePublicIds.slice(0, remoteUrls.length)));
      }

      newImageFiles.forEach((file) => formData.append('images', file));

      if (isEdit) return lostItemsApi.update(id!, formData);
      else return lostItemsApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['lost-items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEdit ? 'Report updated successfully!' : 'Lost item report published!');
      navigate('/lost-items');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save lost item report.');
    },
  });

  const onSubmit = (data: FormData) => submitMutation.mutate(data);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 py-4 pb-20 px-2 sm:px-4">
        {/* Navigation & Progress Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/lost-items"
            className="dash-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold"
          >
            <ArrowLeft size={14} /> Back to Lost Items
          </Link>

          <div className="glass-panel flex items-center gap-3 px-4 py-2">
            <span className="text-xs font-bold" style={{ color: 'var(--dash-text-secondary)' }}>Quality Score:</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all duration-500 ${
                  qualityScore >= 80 ? 'bg-emerald-500' : qualityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${qualityScore}%` }}
              />
            </div>
            <span className="text-xs font-black" style={{ color: 'var(--dash-text-primary)' }}>{qualityScore}%</span>
          </div>
        </div>

        {/* Hero Glass Banner */}
        <div className="glass-hero-banner p-6 sm:p-8">
          <div className="flex items-center gap-4 relative z-10">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                {isEdit ? 'Edit Lost Item Report' : 'Report a Lost Item'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium" style={{ color: 'var(--dash-text-secondary)' }}>
                Provide accurate details to enable automatic AI matching with reported found items.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-panel p-6 sm:p-10 space-y-8"
        >
          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <Tag size={16} className="text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                1. Basic Item Information
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  {watchAll.category === 'Other' ? 'Item Name' : 'Item Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    watchAll.category === 'Other'
                      ? 'Enter the item name, e.g. Umbrella, ID Holder, Watch'
                      : 'e.g., Apple iPhone 14 Pro Max in Space Black'
                  }
                  {...register('itemName', {
                    required: watchAll.category === 'Other' ? 'Please enter the item name.' : 'Item title is required',
                    validate: (value) => {
                      if (!value || !value.trim()) {
                        return watchAll.category === 'Other' ? 'Please enter the item name.' : 'Item title is required';
                      }
                      return true;
                    },
                  })}
                  className={`glass-input h-11 w-full px-4 text-xs sm:text-sm font-medium ${errors.itemName ? 'border-rose-500' : ''}`}
                />
                {errors.itemName && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.itemName.message}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls.replace('mb-2', '')}>
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={enhancing}
                  className="dash-btn-secondary inline-flex items-center gap-1 py-1 px-2.5 text-[11px] font-bold"
                >
                  <Wand2 size={12} className={enhancing ? 'animate-spin' : ''} />
                  {enhancing ? 'Enhancing...' : 'AI Enhance'}
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Describe key distinguishing features, scratches, stickers, wallpapers, case style, etc..."
                {...register('description', { required: 'Description is required' })}
                className={`glass-input w-full p-4 text-xs sm:text-sm font-medium ${errors.description ? 'border-rose-500' : ''}`}
              />
              {errors.description && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g., Apple, Dell, Titan, Nike"
                  {...register('brand')}
                  className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-medium"
                />
              </div>
              <div>
                <label className={labelCls}>Color / Finish</label>
                <input
                  type="text"
                  placeholder="e.g., Midnight Blue, Matte Black"
                  {...register('color')}
                  className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <MapPin size={16} className="text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                2. Where & When was it Lost?
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Where was it lost on campus? <span className="text-rose-500">*</span>
                </label>
                <LocationPickerInput
                  value={watchAll.lostLocation || ''}
                  onChange={(val) => setValue('lostLocation', val, { shouldValidate: true })}
                  error={errors.lostLocation?.message}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Date Lost <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('lostDate', { required: 'Date is required' })}
                    className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className={labelCls}>Approximate Time</label>
                  <input
                    type="time"
                    {...register('lostTime')}
                    className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photos Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <FileText size={16} className="text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                3. Item Photos (Optional but Recommended)
              </h2>
            </div>

            <ImageUploader
              images={displayedImages}
              onChange={(urls) => setDisplayedImages(urls)}
              onFilesChange={(files) => setNewImageFiles(files)}
            />
          </div>

          {/* Section 4: Contact & Reward */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <Phone size={16} className="text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                4. Contact & Finder Reward Offer
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('contactNumber', { required: 'Contact number is required' })}
                  className={`glass-input h-11 w-full px-4 text-xs sm:text-sm font-medium ${errors.contactNumber ? 'border-rose-500' : ''}`}
                />
                <p className="mt-1 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                  Kept private until an AI match is confirmed by you.
                </p>
              </div>

              <div>
                <label className={labelCls}>
                  Optional Reward Offer (₹ INR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    {...register('rewardAmount', { valueAsNumber: true })}
                    className="glass-input h-11 w-full pl-8 pr-4 text-xs sm:text-sm font-bold"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                  Incentivize finders to safely return your item.
                </p>
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="dash-btn-primary py-3 px-8 text-sm font-bold shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
            >
              <Save size={16} />
              <span>{submitMutation.isPending ? 'Submitting...' : isEdit ? 'Update Report' : 'Publish Lost Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

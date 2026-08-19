import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Wand2, MapPin, Tag, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { foundItemsApi, aiApi } from '../lib/api';
import PageTransition from '../components/PageTransition';
import ImageUploader from '../components/ImageUploader';
import LocationPickerInput from '../components/LocationPickerInput';

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

type FormData = {
  itemName: string;
  category: string;
  description: string;
  foundDate: string;
  foundTime?: string;
  foundLocation: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  rewardExpected?: boolean;
  rewardAmount?: number;
};

const labelCls = 'block text-xs font-bold uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-200';

export default function ReportFoundItemPage() {
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
      foundDate: new Date().toISOString().split('T')[0],
      foundTime: '',
      foundLocation: 'Central Library',
      condition: 'Good',
      rewardExpected: false,
    },
  });

  const watchAll = watch();

  const itemNameValid = (watchAll.itemName?.trim().length || 0) >= 2;
  const categoryValid = !!watchAll.category;
  const descLen = watchAll.description?.trim().length || 0;
  const descValid = descLen >= 5;
  const conditionValid = !!watchAll.condition;
  const locationValid = (watchAll.foundLocation?.trim().length || 0) >= 2;
  const dateValid = !!watchAll.foundDate;

  const qualityScore = Math.min(
    100,
    (itemNameValid ? 20 : 0) +
      (categoryValid ? 15 : 0) +
      (descValid ? 25 : descLen > 0 ? 10 : 0) +
      (conditionValid ? 15 : 0) +
      (locationValid ? 15 : 0) +
      (dateValid ? 10 : 0)
  );

  useEffect(() => {
    if (!isEdit) return;
    const fetchItem = async () => {
      try {
        const res = await foundItemsApi.getById(id!);
        const { item } = res.data;
        setValue('itemName', item.itemName);
        setValue('category', item.category);
        setValue('description', item.description);
        setValue('foundDate', new Date(item.foundDate).toISOString().split('T')[0]);
        setValue('foundTime', item.foundTime || '');
        setValue('foundLocation', item.foundLocation);
        setValue('condition', item.condition || 'Good');
        setValue('rewardExpected', item.rewardExpected || false);
        if (item.rewardAmount !== undefined && item.rewardAmount > 0) {
          setValue('rewardAmount', item.rewardAmount);
        }

        const loadedUrls = item.images?.length ? item.images : item.imageUrl ? [item.imageUrl] : [];
        const loadedPublicIds = item.imagePublicIds?.length ? item.imagePublicIds : item.imagePublicId ? [item.imagePublicId] : [];
        setExistingImagePublicIds(loadedPublicIds);
        setDisplayedImages(loadedUrls);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load found item details.');
      }
    };
    fetchItem();
  }, [id, isEdit, setValue]);

  const handleEnhanceDescription = async () => {
    const itemName = getValues('itemName');
    const category = getValues('category');
    const description = getValues('description');
    const location = getValues('foundLocation');

    if (!itemName || !description) {
      toast.error('Please fill in Item Title and a brief Description first.');
      return;
    }

    setEnhancing(true);
    try {
      const res = await aiApi.enhanceDescription({ itemName, category, description, location });
      if (res.data?.enhancedDescription) {
        setValue('description', res.data.enhancedDescription, { shouldValidate: true });
        toast.success('Description enhanced with AI!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not enhance description. Please try again.');
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
          if (!Number.isNaN(num) && num > 0) {
            formData.append('rewardAmount', String(num));
          }
        } else if (val !== undefined && val !== null && val !== '') {
          formData.append(key, typeof val === 'boolean' ? String(val) : val);
        }
      });

      const remoteUrls = displayedImages.filter((img) => img.startsWith('http://') || img.startsWith('https://'));
      if (remoteUrls.length > 0) {
        formData.append('existingImageUrls', JSON.stringify(remoteUrls));
        formData.append('existingImagePublicIds', JSON.stringify(existingImagePublicIds.slice(0, remoteUrls.length)));
      }

      newImageFiles.forEach((file) => formData.append('images', file));

      if (isEdit) return foundItemsApi.update(id!, formData);
      else return foundItemsApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['found-items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEdit ? 'Report updated successfully!' : 'Found item report published!');
      navigate('/found-items');
    },
    onError: (err: any) => {
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        if (serverMsg.includes('rewardAmount') || serverMsg.includes('number to be >0')) {
          toast.error('Reward amount must be greater than ₹0.');
        } else {
          toast.error(serverMsg);
        }
      } else {
        toast.error('Failed to save found item report. Please try again.');
      }
    },
  });

  const onSubmit = (data: FormData) => submitMutation.mutate(data);

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 py-4 pb-20 px-2 sm:px-4">
        {/* Header Navigation & Score */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/found-items"
            className="dash-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold"
          >
            <ArrowLeft size={14} /> Back to Found Items
          </Link>

          <div className="glass-panel flex items-center gap-3 px-4 py-2">
            <span className="text-xs font-bold" style={{ color: 'var(--dash-text-secondary)' }}>Report Completeness:</span>
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
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                {isEdit ? 'Edit Found Item Report' : 'Report a Found Item'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium" style={{ color: 'var(--dash-text-secondary)' }}>
                Thank you for being an honest campus community member! Log the found item below to help return it.
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
              <Tag size={16} className="text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                1. Item Details & Condition
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
                  {watchAll.category === 'Other' ? 'Item Name' : 'Item Name / Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    watchAll.category === 'Other'
                      ? 'Enter the item name, e.g. Umbrella, ID Holder, Watch'
                      : 'e.g., Casio FX-991EX Scientific Calculator'
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
                placeholder="Describe condition, identifying traits, where it was spotted or picked up..."
                {...register('description', { required: 'Description is required' })}
                className={`glass-input w-full p-4 text-xs sm:text-sm font-medium ${errors.description ? 'border-rose-500' : ''}`}
              />
              {errors.description && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.description.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Item Condition</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CONDITIONS.map((cond) => (
                  <label
                    key={cond}
                    className={`glass-action-card flex items-center justify-center gap-2 p-3 text-xs font-bold transition cursor-pointer ${
                      watch('condition') === cond
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      value={cond}
                      {...register('condition')}
                      className="hidden"
                    />
                    {cond}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Location & Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <MapPin size={16} className="text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                2. Where & When was it Found?
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Where was it found on campus? <span className="text-rose-500">*</span>
                </label>
                <LocationPickerInput
                  value={watchAll.foundLocation || ''}
                  onChange={(val) => setValue('foundLocation', val, { shouldValidate: true })}
                  error={errors.foundLocation?.message}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Date Found <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('foundDate', { required: 'Date is required' })}
                    className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className={labelCls}>Approximate Time</label>
                  <input
                    type="time"
                    {...register('foundTime')}
                    className="glass-input h-11 w-full px-4 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photos Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--glass-border)' }}>
              <FileText size={16} className="text-emerald-500" />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>
                3. Item Photos
              </h2>
            </div>

            <ImageUploader
              images={displayedImages}
              onChange={(urls) => setDisplayedImages(urls)}
              onFilesChange={(files) => setNewImageFiles(files)}
            />
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="dash-btn-primary py-3 px-8 text-sm font-bold shadow-lg inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{submitMutation.isPending ? 'Submitting...' : isEdit ? 'Update Found Report' : 'Publish Found Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

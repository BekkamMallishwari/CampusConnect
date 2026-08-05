import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Sparkles, Wand2, MapPin, Tag, Phone, Gift } from 'lucide-react';
import { lostItemsApi, aiApi } from '../lib/api';
import PageTransition from '../components/PageTransition';
import ImageUploader from '../components/ImageUploader';

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];
const LOCATIONS = [
  'Central Library',
  'Student Activity Center (SAC)',
  'Main Academic Block (AB-1)',
  'Engineering Workshop',
  'Sports Complex',
  'Hostel Block A',
  'Cafeteria',
  'Other',
];

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

const fieldCls = `w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 outline-none
  bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  border-slate-300 dark:border-slate-600
  focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.15)]`;

const errorFieldCls = `w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 outline-none
  bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  border-red-400 dark:border-red-500
  focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]`;

const labelCls = 'block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5';

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
      rewardAmount: '' as unknown as number, // User must explicitly set their reward offer
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
        if (val !== undefined && val !== null) formData.append(key, val);
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
      <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20 px-4 sm:px-6">
        {/* Header Navigation & Score */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/lost-items"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft size={16} /> Back to Lost Items
          </Link>

          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Report Completeness:</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full transition-all duration-500 ${
                  qualityScore >= 80 ? 'bg-emerald-500' : qualityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${qualityScore}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">{qualityScore}%</span>
          </div>
        </div>

        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white shadow-lg sm:p-8">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,white,transparent_60%)]" />
          <div className="flex items-center gap-4 relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-md backdrop-blur-sm">
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                {isEdit ? 'Edit Lost Item Report' : 'Report a Lost Item'}
              </h1>
              <p className="mt-1 text-sm font-medium text-blue-200">
                Provide accurate details to enable automatic AI matching with reported found items.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-md sm:p-10"
        >
          {/* Section 1 */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Tag size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                1. Basic Item Details
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Item Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('itemName', { required: 'Item title is required' })}
                  placeholder="e.g. Blue Hydro Flask Water Bottle"
                  className={errors.itemName ? errorFieldCls : fieldCls}
                />
                {errors.itemName && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.itemName.message}</p>}
              </div>

              <div>
                <label className={labelCls}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={fieldCls}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={enhancing}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50"
                >
                  <Wand2 size={13} className={enhancing ? 'animate-spin' : ''} />
                  {enhancing ? 'Enhancing...' : '✨ Enhance with AI'}
                </button>
              </div>
              <textarea
                rows={4}
                {...register('description', { required: 'Description is required' })}
                placeholder="Include color, scratches, stickers, distinct engravings, or contents..."
                className={errors.description ? errorFieldCls : fieldCls}
              />
              {errors.description && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.description.message}</p>}
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MapPin size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                2. Location & Date Lost
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className={labelCls}>
                  Last Seen Location <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('lostLocation', { required: 'Location is required' })}
                  className={fieldCls}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  Date Lost <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('lostDate', { required: 'Date is required' })}
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Approximate Time</label>
                <input
                  type="text"
                  {...register('lostTime')}
                  placeholder="e.g. Around 2:30 PM"
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                3. Attributes & Image Upload
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Brand Name</label>
                <input
                  type="text"
                  {...register('brand')}
                  placeholder="e.g. Sony, Apple, Nike"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Primary Color</label>
                <input
                  type="text"
                  {...register('color')}
                  placeholder="e.g. Matte Black / Silver"
                  className={fieldCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Item Photos
              </label>
              <ImageUploader
                images={displayedImages}
                onChange={(imgs) => setDisplayedImages(imgs)}
                onFilesChange={(files) => setNewImageFiles(files)}
                maxImages={5}
              />
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Phone size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                4. Contact Information <span className="text-red-500">*</span>
              </h2>
            </div>
            <input
              type="text"
              {...register('contactNumber', { required: 'Contact phone number is required' })}
              placeholder="e.g. +1 (555) 019-2834"
              className={errors.contactNumber ? errorFieldCls : fieldCls}
            />
            {errors.contactNumber && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.contactNumber.message}</p>}
          </div>

          {/* Section 5: Reward */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Gift size={18} className="text-blue-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                5. Reward Offer <span className="text-red-500">*</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Offer a reward to incentivize finders. This can be negotiated later.</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
              <input
                type="number"
                min="1"
                {...register('rewardAmount', { 
                  required: 'Reward amount is required',
                  min: { value: 1, message: 'Reward must be at least ₹1' }
                })}
                placeholder="e.g. 500"
                className={`${errors.rewardAmount ? errorFieldCls : fieldCls} pl-8`}
              />
            </div>
            {errors.rewardAmount && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.rewardAmount.message}</p>}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => navigate('/lost-items')}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.3)] disabled:opacity-50"
            >
              <Save size={16} />
              {submitMutation.isPending ? 'Publishing...' : isEdit ? 'Update Report' : 'Publish Report'}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

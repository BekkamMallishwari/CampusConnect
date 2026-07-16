import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { foundItemsApi } from '../lib/api';
import ImageUploader from '../components/ImageUploader';

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

export default function ReportFoundItemPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [rewardExpected, setRewardExpected] = useState(false);
  
  const { register, handleSubmit, setValue } = useForm();

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
        setValue('condition', item.condition);
        setValue('rewardExpected', item.rewardExpected);
        setValue('rewardAmount', item.rewardAmount || '');
        setRewardExpected(item.rewardExpected);
        setExistingImages(item.images || []);
      } catch (err) {
        toast.error('Failed to load item report.');
      }
    };
    fetchItem();
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const fd = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        fd.append(key, data[key]);
      }
    });

    images.forEach((file) => {
      fd.append('images', file);
    });

    try {
      if (isEdit) {
        await foundItemsApi.update(id!, fd);
        toast.success('Found report updated successfully.');
      } else {
        await foundItemsApi.create(fd);
        toast.success('Found report published! Searching for lost matches...');
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-8 backdrop-blur-md">
        <h1 className="text-3xl font-extrabold text-white">{isEdit ? 'Edit Found Report' : 'Report Found Item'}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Provide as many details as possible. We use this data to compare with missing items.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Item Name</label>
              <input
                type="text"
                required
                {...register('itemName', { required: true })}
                placeholder="e.g. Leather Wallet found near library"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Category</label>
              <select
                required
                {...register('category', { required: true })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Condition</label>
              <select
                required
                {...register('condition', { required: true })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-355">Found Date</label>
              <input
                type="date"
                required
                {...register('foundDate', { required: true })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Found Time</label>
              <input
                type="text"
                {...register('foundTime')}
                placeholder="e.g. 10:30 AM"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Found Location</label>
              <input
                type="text"
                required
                {...register('foundLocation', { required: true })}
                placeholder="e.g. Library Courtyard bench"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Description</label>
              <textarea
                required
                rows={4}
                {...register('description', { required: true })}
                placeholder="Describe details (color, brand, serial numbers, visible features, items inside...)"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Upload Images</label>
              <ImageUploader onChange={setImages} initialImages={existingImages} />
            </div>

            <div className="space-y-4 md:col-span-2 border-t border-slate-900 pt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rewardExpected"
                  {...register('rewardExpected')}
                  checked={rewardExpected}
                  onChange={(e) => {
                    setRewardExpected(e.target.checked);
                    setValue('rewardExpected', e.target.checked);
                  }}
                  className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 outline-none"
                />
                <label htmlFor="rewardExpected" className="text-sm font-semibold text-white cursor-pointer select-none">
                  I expect a reward for finding this item
                </label>
              </div>

              {rewardExpected && (
                <div className="w-full sm:w-1/2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-sm text-slate-350">Suggested Reward Amount (USD)</label>
                  <input
                    type="number"
                    min="1"
                    {...register('rewardAmount')}
                    placeholder="e.g. 20"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-cyan-500/15"
          >
            <Save size={16} />
            {loading ? 'Submitting report...' : isEdit ? 'Update Report' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { lostItemsApi } from '../lib/api';
import ImageUploader from '../components/ImageUploader';

const CATEGORIES = ['Electronics', 'Wallets', 'Keys', 'IDs/Documents', 'Clothing', 'Books', 'Accessories', 'Other'];

export default function ReportLostItemPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const { register, handleSubmit, setValue } = useForm();

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
        await lostItemsApi.update(id!, fd);
        toast.success('Lost report updated successfully.');
      } else {
        await lostItemsApi.create(fd);
        toast.success('Lost report published successfully. We are searching for matches...');
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
        <h1 className="text-3xl font-extrabold text-white">{isEdit ? 'Edit Lost Report' : 'Report Lost Item'}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Provide as many details as possible. Our smart matching system uses these fields to search matches.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Item Name</label>
              <input
                type="text"
                required
                {...register('itemName', { required: true })}
                placeholder="e.g. Leather Gucci Wallet"
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
              <label className="text-sm text-slate-355">Color</label>
              <input
                type="text"
                {...register('color')}
                placeholder="e.g. Black"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Brand</label>
              <input
                type="text"
                {...register('brand')}
                placeholder="e.g. Gucci"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Lost Date</label>
              <input
                type="date"
                required
                {...register('lostDate', { required: true })}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Lost Time</label>
              <input
                type="text"
                {...register('lostTime')}
                placeholder="e.g. 2:00 PM, Afternoon"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Lost Location</label>
              <input
                type="text"
                required
                {...register('lostLocation', { required: true })}
                placeholder="e.g. Engineering Block Room 204"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Description</label>
              <textarea
                required
                rows={4}
                {...register('description', { required: true })}
                placeholder="Describe details (e.g. keychains, scratches, tags, contents, cardholder contents...)"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Upload Images</label>
              <ImageUploader onChange={setImages} initialImages={existingImages} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-350">Contact Number</label>
              <input
                type="tel"
                required
                {...register('contactNumber', { required: true })}
                placeholder="+1 (555) 019-2834"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-slate-350">Additional Notes</label>
              <textarea
                rows={2}
                {...register('additionalNotes')}
                placeholder="Any special handling or reward details you'd like to share"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
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

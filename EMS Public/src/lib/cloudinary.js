// Cloudinary Image Uploader Service for Public Portal

export const isCloudinaryConfigured = () => true;

export const uploadToCloudinary = async (file, folder = 'EMS') => {
  if (!file) return null;

  try {
    let base64String = '';

    if (typeof file === 'string') {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return file; // Already a hosted CDN / HTTP URL
      }
      base64String = file; // Already a base64 Data URI
    } else if (file instanceof Blob || file instanceof File) {
      base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      return null;
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const res = await fetch(`${API_BASE}/api/public/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64String, folder })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        console.log('✅ Cloudinary Image Upload Success:', data.url);
        return data.url;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('⚠️ Server Upload Notice:', errData.error || res.statusText);
    }
  } catch (err) {
    console.warn('⚠️ Server Upload Exception:', err.message);
  }

  return typeof file === 'string' ? file : null;
};

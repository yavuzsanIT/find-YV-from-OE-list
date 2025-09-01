import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  // Yeni state'ler: Arama kriterleri için
  const [searchColumn, setSearchColumn] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>(['']); // Başlangıçta bir boş alan

  // Dosya seçme ve sürükle-bırak işlemleri aynı kalıyor
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  // Yeni fonksiyon: Arama kelimesi input'larını yönetmek için
  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  // Yeni fonksiyon: Yeni bir arama kelimesi input'u eklemek için
  const addKeywordInput = () => {
    setKeywords([...keywords, '']);
  };

  // Yeni fonksiyon: Arama kelimesi input'unu silmek için
  const removeKeywordInput = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(newKeywords);
  };

  // Yükleme fonksiyonunu yeni parametrelerle güncelle
  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    const filteredKeywords = keywords.map(k => k.trim()).filter(k => k.length >= 2);
    if (searchColumn.trim().length < 2) {
      setError('Arama yapılacak sütun kelimesi en az 2 karakter olmalı.');
      return;
    }
    if (filteredKeywords.length === 0) {
      setError('Lütfen en az bir geçerli arama kelimesi girin.');
      return;
    }

    // Benzersizlik kontrolü
    const uniqueKeywords = new Set(filteredKeywords);
    if (uniqueKeywords.size !== filteredKeywords.length) {
      setError('Aynı arama kelimesini birden fazla kez girmeyin.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('searchColumn', searchColumn);
      formData.append('keywords', filteredKeywords.join(',')); // String olarak gönderiyoruz

      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFilename(res.data.filename);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Yükleme başarısız.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!filename) return;
    // API rotasına /api ekliyoruz
    window.location.href = `${API_URL}/download/${filename}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Excel Dosyası İşleyici</h2>

        {/* Dosya yükleme bölümü */}
        <div
          className="border-2 border-dashed border-gray-300 rounded p-4 mb-4 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {file ? (
            <span className="text-green-600">{file.name}</span>
          ) : (
            <span className="text-gray-500">Excel dosyanızı buraya sürükleyin & bırakın</span>
          )}
        </div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="mb-4 w-full"
          onChange={handleFileChange}
        />

        {/* Arama kriterleri bölümü */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="search-column">Sütun Adında Aranacak Kelime</label>
          <input
            id="search-column"
            type="text"
            placeholder="Örn: OE, Cross-Code"
            className="w-full border-gray-300 rounded-md shadow-sm p-2"
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Aranacak Değerler</label>
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Aranacak değer"
                className="flex-grow border-gray-300 rounded-md shadow-sm p-2"
                value={keyword}
                onChange={(e) => handleKeywordChange(index, e.target.value)}
              />
              {keywords.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKeywordInput(index)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addKeywordInput}
            className="w-full text-blue-600 border border-blue-600 py-2 rounded-md hover:bg-blue-50 transition"
          >
            Yeni Değer Ekle
          </button>
        </div>

        {/* Aksiyon butonları ve durum mesajları */}
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? 'Yükleniyor...' : 'Yükle & İşle'}
        </button>

        {filename && (
          <button
            className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            onClick={handleDownload}
          >
            İşlenmiş Excel'i İndir
          </button>
        )}

        {error && (
          <div className="mt-4 text-red-600 text-center">{error}</div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
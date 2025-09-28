// --- import yang BENAR sesuai struktur folder kamu ---
import React, { useState, useCallback } from 'react';
import ImageUploader from './Component/ImageUploader';
import GeneratedImage from './Component/GeneratedImage';
import Loader from './Component/Loader';
import { SparklesIcon } from './Component/Icons/SparklesIcon';
import { generateCollage } from './Services/geminiService';
import { fileToBase64 } from './Utils/fileUtils';
// --- selesai blok import ---

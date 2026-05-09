import { useState, useEffect, useRef } from "react";
import "@/App.css";

const SUPABASE_URL = "https://pntqobqhaggvcjtyspvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHFvYnFoYWdndmNqdHlzcHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjYwNjQsImV4cCI6MjA5MTUwMjA2NH0.fdl8d8I0UoDyWGDPK0VNUZBaEBQD4cz-ReowhbtxH0k";
const STORAGE_BUCKET = "portfolio-images";

// Admin auth is handled via Supabase `admin_settings` table (id, username, password, created_at)

// Renders text with **bold** markers and preserves line breaks.
function renderRich(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li} style={{ display: 'block' }}>
        {parts.map((p, pi) => {
          if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
            return <strong key={pi} className="rich-bold">{p.slice(2, -2)}</strong>;
          }
          return <span key={pi}>{p}</span>;
        })}
        {line === '' && '\u00A0'}
      </span>
    );
  });
}

// Textarea with a "Bold" toolbar button. Inserts ** at cursor; click again to close.
function BoldTextarea({ value, onChange, placeholder, dataTestId }) {
  const ref = useRef(null);
  const insertBold = () => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = (value || '').slice(0, start);
    const selected = (value || '').slice(start, end);
    const after = (value || '').slice(end);
    let newVal;
    let cursorPos;
    if (selected) {
      newVal = `${before}**${selected}**${after}`;
      cursorPos = end + 4;
    } else {
      newVal = `${before}**${after}`;
      cursorPos = start + 2;
    }
    onChange(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursorPos, cursorPos); }, 0);
  };
  return (
    <div className="bold-textarea-wrapper">
      <div className="bold-toolbar">
        <button type="button" className="bold-btn" onClick={insertBold} title="نص عريض (يضع ** حول النص)">
          <strong>B</strong> عريض
        </button>
        <span className="bold-hint">ضع ** قبل وبعد النص ليصبح عريض</span>
      </div>
      <textarea
        ref={ref}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={dataTestId}
      />
    </div>
  );
}

const CLICK_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  const [adminTab, setAdminTab] = useState('works');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null);

  const [updates, setUpdates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [works, setWorks] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // My Tasks (إدارة أعمالي)
  const [myTasks, setMyTasks] = useState([]);
  const [myTasksTab, setMyTasksTab] = useState('pending');
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'كرت فيزيت' });
  const [newTaskImage, setNewTaskImage] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskImage, setEditTaskImage] = useState(null);

  // Orders (الطلبات)
  const [orders, setOrders] = useState([]);
  const emptyOrder = { customer_name: '', phone: '', description: '', category: 'كرت فيزيت', expiry_date: '', remaining_amount: '', status: 'designing' };
  const [newOrder, setNewOrder] = useState(emptyOrder);
  const [newOrderImage, setNewOrderImage] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderImage, setEditOrderImage] = useState(null);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersSubmitted, setOrdersSubmitted] = useState(false);

  // About Settings
  const [aboutSettings, setAboutSettings] = useState({ image_url: '', title: '', description: '', button_text: '', button_link: '' });
  const [aboutImage, setAboutImage] = useState(null);
  const [aboutCardActive, setAboutCardActive] = useState(false);

  const [newUpdate, setNewUpdate] = useState({ version: '', title: '', description: '' });
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '', button_text: '', button_link: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newWork, setNewWork] = useState({ title: '', description: '', category: 'كرت فيزيت' });
  const [newWorkImage, setNewWorkImage] = useState(null);
  const [editingWork, setEditingWork] = useState(null);
  const [editWorkImage, setEditWorkImage] = useState(null);
  const [newSocial, setNewSocial] = useState({ platform: '', url: '', icon: 'fab fa-facebook' });
  const [editingSocial, setEditingSocial] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const audioRef = useRef(null);

  const categories = ['كرت فيزيت', 'فلكسة', 'دفتر فواتير', 'ختم', 'بروشور', 'دعوة وتس', 'آيات قرآنية', 'شهادة وفاة', 'آخر'];
  const orderStatuses = [
    { value: 'designing', label: 'قيد التصميم', icon: 'fas fa-pen-ruler', color: 'designing' },
    { value: 'printing', label: 'قيد الطباعة', icon: 'fas fa-print', color: 'printing' },
    { value: 'ready', label: 'جاهز', icon: 'fas fa-check-circle', color: 'ready' }
  ];
  const socialIcons = [
    { value: 'fab fa-facebook', label: 'فيسبوك' },
    { value: 'fab fa-instagram', label: 'انستغرام' },
    { value: 'fab fa-twitter', label: 'تويتر' },
    { value: 'fab fa-tiktok', label: 'تيك توك' },
    { value: 'fab fa-youtube', label: 'يوتيوب' },
    { value: 'fab fa-whatsapp', label: 'واتساب' },
    { value: 'fab fa-telegram', label: 'تيليجرام' },
    { value: 'fab fa-snapchat', label: 'سناب شات' },
    { value: 'fab fa-linkedin', label: 'لينكد إن' },
    { value: 'fas fa-globe', label: 'موقع إلكتروني' }
  ];

  const playClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 9000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      checkAnnouncements();
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, []);

  // ---------- Supabase helpers ----------
  const supabaseFetch = async (endpoint, options = {}) => {
    return await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  };

  const sbGet = async (endpoint) => {
    const r = await supabaseFetch(endpoint);
    if (!r.ok) return [];
    return await r.json();
  };

  const sbInsert = async (table, data) => {
    return await supabaseFetch(table, {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data)
    });
  };

  const sbUpdate = async (table, id, data) => {
    return await supabaseFetch(`${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data)
    });
  };

  const sbDelete = async (table, id) => {
    return await supabaseFetch(`${table}?id=eq.${id}`, { method: 'DELETE' });
  };

  const uploadImage = async (file) => {
    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const fileName = `${Date.now()}_${safeName}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
      body: file
    });
    if (response.ok) return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
    throw new Error('Upload failed');
  };

  // ---------- Fetchers ----------
  const fetchUpdates = async () => { setUpdates(await sbGet('updates?select=*&order=created_at.desc')); };
  const fetchAnnouncements = async () => { setAnnouncements(await sbGet('announcements?select=*&order=created_at.desc')); };
  const fetchWorks = async () => { setWorks(await sbGet('images?select=*&order=created_at.desc')); };
  const fetchSocialLinks = async () => { setSocialLinks(await sbGet('social_links?select=*&order=created_at.desc')); };
  const fetchMessages = async () => { setMessages(await sbGet('messages?select=*&order=created_at.desc')); };
  const fetchMyTasks = async () => { setMyTasks(await sbGet('my_tasks?select=*&order=created_at.desc')); };
  const fetchOrders = async () => { setOrders(await sbGet('orders?select=*&order=created_at.desc')); };
  const fetchAboutSettings = async () => {
    const data = await sbGet('about_settings?select=*&order=updated_at.desc&limit=1');
    if (data && data.length > 0) setAboutSettings(data[0]);
  };

  const checkAnnouncements = async () => {
    const seen = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    try {
      const data = await sbGet('announcements?select=*&is_active=eq.true&order=created_at.desc');
      const unseen = data.find(a => !seen.includes(a.id));
      if (unseen) {
        setActiveAnnouncement(unseen);
        setShowAnnouncement(true);
      }
    } catch (e) { console.error(e); }
  };

  const dismissAnnouncement = () => {
    if (activeAnnouncement) {
      const seen = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
      seen.push(activeAnnouncement.id);
      localStorage.setItem('seenAnnouncements', JSON.stringify(seen));
    }
    setShowAnnouncement(false);
  };

  useEffect(() => {
    if (currentPage === 'updates') fetchUpdates();
    if (currentPage === 'gallery') fetchWorks();
    if (currentPage === 'orders') fetchOrders();
    if (currentPage === 'about') { fetchSocialLinks(); fetchAboutSettings(); }
    if (currentPage === 'admin' && isLoggedIn) {
      fetchWorks(); fetchMessages(); fetchUpdates(); fetchAnnouncements();
      fetchSocialLinks(); fetchMyTasks(); fetchAboutSettings(); fetchOrders();
    }
    // eslint-disable-next-line
  }, [currentPage, isLoggedIn, adminTab]);

  // ---------- Auth ----------
  const handleLogin = async () => {
    playClick();
    if (!username || !password) {
      showToast('أدخل اسم المستخدم وكلمة المرور');
      return;
    }
    try {
      const u = encodeURIComponent(username);
      const p = encodeURIComponent(password);
      const data = await sbGet(`admin_settings?select=id,username&username=eq.${u}&password=eq.${p}&limit=1`);
      if (data && data.length > 0) {
        setIsLoggedIn(true); setShowLoginModal(false); setCurrentPage('admin');
        showToast('مرحباً أيها المطور'); setUsername(''); setPassword('');
      } else {
        showToast('اسم المستخدم أو كلمة المرور خاطئة!');
      }
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ في الاتصال بالخادم');
    }
  };

  const handleLogout = () => { playClick(); setIsLoggedIn(false); setCurrentPage('home'); showToast('تم تسجيل الخروج بنجاح'); };

  // ---------- Works CRUD ----------
  const createWork = async () => {
    playClick();
    if (!newWork.title || !newWorkImage) { showToast('أكمل البيانات واختر صورة'); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newWorkImage);
      await sbInsert('images', { title: newWork.title, description: newWork.description, category: newWork.category, image_url: imageUrl });
      showToast('تم إضافة العمل'); setNewWork({ title: '', description: '', category: 'كرت فيزيت' }); setNewWorkImage(null); fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const updateWork = async () => {
    playClick(); if (!editingWork) return; setUploading(true);
    try {
      let imageUrl = editingWork.image_url;
      if (editWorkImage) imageUrl = await uploadImage(editWorkImage);
      await sbUpdate('images', editingWork.id, { title: editingWork.title, description: editingWork.description, category: editingWork.category, image_url: imageUrl });
      showToast('تم تحديث العمل'); setEditingWork(null); setEditWorkImage(null); fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const deleteWork = async (id) => { try { await sbDelete('images', id); showToast('تم حذف العمل'); fetchWorks(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- My Tasks CRUD ----------
  const createMyTask = async () => {
    playClick();
    if (!newTask.title || !newTaskImage) { showToast('أكمل البيانات واختر صورة'); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newTaskImage);
      await sbInsert('my_tasks', { title: newTask.title, description: newTask.description, category: newTask.category, image_url: imageUrl, status: 'pending' });
      showToast('تم إضافة العمل'); setNewTask({ title: '', description: '', category: 'كرت فيزيت' }); setNewTaskImage(null); fetchMyTasks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const updateMyTask = async () => {
    playClick(); if (!editingTask) return; setUploading(true);
    try {
      let imageUrl = editingTask.image_url;
      if (editTaskImage) imageUrl = await uploadImage(editTaskImage);
      await sbUpdate('my_tasks', editingTask.id, { title: editingTask.title, description: editingTask.description, category: editingTask.category, image_url: imageUrl });
      showToast('تم تحديث العمل'); setEditingTask(null); setEditTaskImage(null); fetchMyTasks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const changeTaskStatus = async (id, newStatus) => {
    playClick();
    try { await sbUpdate('my_tasks', id, { status: newStatus }); showToast('تم تحديث الحالة'); fetchMyTasks(); } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteMyTask = async (id) => { try { await sbDelete('my_tasks', id); showToast('تم حذف العمل'); fetchMyTasks(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- Orders CRUD ----------
  const createOrder = async () => {
    playClick();
    if (!newOrder.customer_name || !newOrder.phone || !newOrderImage) { showToast('أكمل البيانات (الاسم والرقم والصورة)'); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newOrderImage);
      const payload = {
        customer_name: newOrder.customer_name,
        phone: newOrder.phone,
        description: newOrder.description,
        category: newOrder.category,
        expiry_date: newOrder.expiry_date || null,
        remaining_amount: newOrder.remaining_amount ? parseFloat(newOrder.remaining_amount) : 0,
        status: newOrder.status,
        image_url: imageUrl
      };
      const r = await sbInsert('orders', payload);
      if (!r.ok) {
        const err = await r.text();
        showToast('خطأ: تأكد من إنشاء جدول orders');
        console.error('Orders insert error:', err);
      } else {
        showToast('تم إضافة الطلب');
        setNewOrder(emptyOrder);
        setNewOrderImage(null);
        fetchOrders();
      }
    } catch (e) { showToast('حدث خطأ'); console.error(e); }
    setUploading(false);
  };

  const updateOrder = async () => {
    playClick(); if (!editingOrder) return; setUploading(true);
    try {
      let imageUrl = editingOrder.image_url;
      if (editOrderImage) imageUrl = await uploadImage(editOrderImage);
      await sbUpdate('orders', editingOrder.id, {
        customer_name: editingOrder.customer_name,
        phone: editingOrder.phone,
        description: editingOrder.description,
        category: editingOrder.category,
        expiry_date: editingOrder.expiry_date || null,
        remaining_amount: editingOrder.remaining_amount ? parseFloat(editingOrder.remaining_amount) : 0,
        status: editingOrder.status,
        image_url: imageUrl
      });
      showToast('تم تحديث الطلب'); setEditingOrder(null); setEditOrderImage(null); fetchOrders();
    } catch (e) { showToast('حدث خطأ'); console.error(e); }
    setUploading(false);
  };

  const deleteOrder = async (id) => { try { await sbDelete('orders', id); showToast('تم حذف الطلب'); fetchOrders(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- About Settings ----------
  const saveAboutSettings = async () => {
    playClick(); setUploading(true);
    try {
      let imageUrl = aboutSettings.image_url;
      if (aboutImage) imageUrl = await uploadImage(aboutImage);
      const payload = {
        image_url: imageUrl,
        title: aboutSettings.title,
        description: aboutSettings.description,
        button_text: aboutSettings.button_text,
        button_link: aboutSettings.button_link,
        updated_at: new Date().toISOString()
      };
      if (aboutSettings.id) {
        await sbUpdate('about_settings', aboutSettings.id, payload);
      } else {
        await sbInsert('about_settings', payload);
      }
      showToast('تم حفظ الإعدادات'); setAboutImage(null); fetchAboutSettings();
    } catch (e) { showToast('حدث خطأ'); console.error(e); }
    setUploading(false);
  };

  // ---------- Updates CRUD ----------
  const createUpdate = async () => { playClick(); if (!newUpdate.version || !newUpdate.title) { showToast('أكمل البيانات'); return; } try { await sbInsert('updates', newUpdate); showToast('تم إضافة التحديث'); setNewUpdate({ version: '', title: '', description: '' }); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };
  const updateUpdate = async () => { playClick(); if (!editingUpdate) return; try { await sbUpdate('updates', editingUpdate.id, { version: editingUpdate.version, title: editingUpdate.title, description: editingUpdate.description }); showToast('تم تحديث التحديث'); setEditingUpdate(null); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteUpdate = async (id) => { try { await sbDelete('updates', id); showToast('تم حذف التحديث'); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- Announcements CRUD ----------
  const createAnnouncement = async () => { playClick(); if (!newAnnouncement.title || !newAnnouncement.button_text) { showToast('أكمل البيانات'); return; } try { await sbInsert('announcements', { ...newAnnouncement, is_active: true }); showToast('تم إضافة الإعلان'); setNewAnnouncement({ title: '', description: '', button_text: '', button_link: '' }); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const updateAnnouncement = async () => { playClick(); if (!editingAnnouncement) return; try { await sbUpdate('announcements', editingAnnouncement.id, { title: editingAnnouncement.title, description: editingAnnouncement.description, button_text: editingAnnouncement.button_text, button_link: editingAnnouncement.button_link }); showToast('تم تحديث الإعلان'); setEditingAnnouncement(null); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteAnnouncement = async (id) => { try { await sbDelete('announcements', id); showToast('تم حذف الإعلان'); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const toggleAnnouncementActive = async (ann) => { playClick(); try { await sbUpdate('announcements', ann.id, { is_active: !ann.is_active }); showToast(ann.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان'); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- Social Links CRUD ----------
  const createSocialLink = async () => { playClick(); if (!newSocial.platform || !newSocial.url) { showToast('أكمل البيانات'); return; } try { await sbInsert('social_links', newSocial); showToast('تم إضافة الرابط'); setNewSocial({ platform: '', url: '', icon: 'fab fa-facebook' }); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };
  const updateSocialLink = async () => { playClick(); if (!editingSocial) return; try { await sbUpdate('social_links', editingSocial.id, { platform: editingSocial.platform, url: editingSocial.url, icon: editingSocial.icon }); showToast('تم تحديث الرابط'); setEditingSocial(null); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteSocialLink = async (id) => { try { await sbDelete('social_links', id); showToast('تم حذف الرابط'); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };

  // ---------- Contact ----------
  const submitContact = async () => { playClick(); if (!contactName || !contactPhone) { showToast('أكمل البيانات'); return; } try { await sbInsert('messages', { name: contactName, phone: contactPhone, message: contactMessage }); showToast('تم إرسال رسالتك'); setContactName(''); setContactPhone(''); setContactMessage(''); } catch (e) { showToast('حدث خطأ'); } };
  const deleteMessage = async (id) => { try { await sbDelete('messages', id); showToast('تم حذف الرسالة'); fetchMessages(); } catch (e) { showToast('حدث خطأ'); } };

  const confirmDelete = () => {
    playClick();
    if (deleteModal.type === 'update') deleteUpdate(deleteModal.id);
    else if (deleteModal.type === 'announcement') deleteAnnouncement(deleteModal.id);
    else if (deleteModal.type === 'work') deleteWork(deleteModal.id);
    else if (deleteModal.type === 'social') deleteSocialLink(deleteModal.id);
    else if (deleteModal.type === 'message') deleteMessage(deleteModal.id);
    else if (deleteModal.type === 'mytask') deleteMyTask(deleteModal.id);
    else if (deleteModal.type === 'order') deleteOrder(deleteModal.id);
    setDeleteModal({ show: false, type: '', id: '' });
  };

  const filteredWorks = selectedCategory === 'الكل' ? works : works.filter(w => w.category === selectedCategory);
  const filteredTasks = myTasks.filter(t => t.status === myTasksTab);

  const filteredOrders = orders.filter(o => {
    const q = ordersSearch.trim().toLowerCase();
    if (!q) return true;
    return (o.customer_name || '').toLowerCase().includes(q) || (o.phone || '').toLowerCase().includes(q);
  });

  const getStatusInfo = (status) => orderStatuses.find(s => s.value === status) || orderStatuses[0];
  const formatAmount = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString('en-US');
  };
  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch { return d; }
  };

  const navigateTo = (page) => { playClick(); setCurrentPage(page); setMobileMenuOpen(false); if (page !== 'orders') { setOrdersSubmitted(false); setOrdersSearch(''); } };

  return (
    <div className="app" dir="rtl">
      <audio ref={audioRef} src={CLICK_SOUND_URL} preload="auto" />

      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-orbs">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="intro-orb" style={{ left: `${(i * 7 + 3) % 100}%`, animationDelay: `${(i * 0.4) % 5}s`, animationDuration: `${6 + (i % 5)}s` }}></span>
            ))}
          </div>
          <div className="intro-content">
            <h1 className="glitch-title">LAMSAT FANN</h1>
            <div className="luxury-line"></div>
            <p className="reveal-text">أهلاً بك في عالم التصميم.. حيث تضيع الحدود بين الخيال والواقع</p>
          </div>
        </div>
      )}

      {/* Floating green orbs across all pages */}
      <div className="bg-orbs" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="bg-orb"
            style={{
              left: `${(i * 11 + 5) % 100}%`,
              width: `${6 + (i % 5) * 3}px`,
              height: `${6 + (i % 5) * 3}px`,
              animationDelay: `${(i * 0.7) % 8}s`,
              animationDuration: `${10 + (i % 7) * 2}s`,
              opacity: 0.35 + ((i % 4) * 0.12),
            }}
          ></span>
        ))}
      </div>

      {showAnnouncement && activeAnnouncement && (
        <div className="modal-overlay"><div className="announcement-box"><div className="announcement-icon"><i className="fas fa-bullhorn"></i></div><h3 className="announcement-title">{activeAnnouncement.title}</h3><p className="announcement-desc">{renderRich(activeAnnouncement.description)}</p><div className="announcement-actions"><button className="announcement-btn primary" onClick={() => { playClick(); dismissAnnouncement(); if (activeAnnouncement.button_link) navigateTo(activeAnnouncement.button_link); }}>{activeAnnouncement.button_text}</button><button className="announcement-btn secondary" onClick={() => { playClick(); dismissAnnouncement(); }}>إغلاق</button></div></div></div>
      )}

      {toast && <div className="toast-container"><div className="toast"><i className="fas fa-info-circle"></i> {toast}</div></div>}

      <nav className="luxury-nav">
        <input type="checkbox" id="nav-checkbox" className="nav-checkbox-hidden" checked={mobileMenuOpen} onChange={() => { playClick(); setMobileMenuOpen(!mobileMenuOpen); }} />
        <label htmlFor="nav-checkbox" className="hamburger-toggle" data-testid="mobile-menu-btn" aria-label="Menu">
          <div className="bars" id="bar1"></div>
          <div className="bars" id="bar2"></div>
          <div className="bars" id="bar3"></div>
        </label>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <button className="nav-btn stagger-link" style={{ '--i': 0 }} data-testid="nav-home" onClick={() => navigateTo('home')}>الرئيسية</button>
          <button className="nav-btn stagger-link" style={{ '--i': 1 }} data-testid="nav-gallery" onClick={() => navigateTo('gallery')}>المعرض</button>
          <button className="nav-btn stagger-link" style={{ '--i': 2 }} data-testid="nav-orders" onClick={() => navigateTo('orders')}>الطلبات</button>
          <button className="nav-btn stagger-link" style={{ '--i': 3 }} data-testid="nav-contact" onClick={() => navigateTo('contact')}>تواصل معنا</button>
          <button className="nav-btn stagger-link" style={{ '--i': 4 }} data-testid="nav-about" onClick={() => navigateTo('about')}>معلومات عننا</button>
          <button className="nav-btn stagger-link" style={{ '--i': 5 }} data-testid="nav-updates" onClick={() => navigateTo('updates')}>التحديثات</button>
          <button className="gear-btn stagger-link" style={{ '--i': 6 }} data-testid="nav-developer" onClick={() => { playClick(); isLoggedIn ? navigateTo('admin') : setShowLoginModal(true); }}><i className="fas fa-cog"></i> المطور</button>
        </div>
      </nav>

      {showLoginModal && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>دخول المطور</h3><input type="text" data-testid="login-username" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} /><input type="password" data-testid="login-password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} /><div className="modal-actions"><button className="submit-btn" data-testid="login-submit" onClick={handleLogin}>دخول</button><button className="cancel-btn" onClick={() => { playClick(); setShowLoginModal(false); }}>إلغاء</button></div></div></div>
      )}

      {deleteModal.show && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>تأكيد الحذف</h3><p>هل أنت متأكد من الحذف؟</p><div className="modal-actions"><button className="btn-delete" data-testid="confirm-delete-btn" onClick={confirmDelete}>حذف</button><button className="cancel-btn" onClick={() => { playClick(); setDeleteModal({ show: false, type: '', id: '' }); }}>إلغاء</button></div></div></div>
      )}

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}><span className="close-lightbox" onClick={() => setLightboxImage(null)}>✕</span><img src={lightboxImage} alt="Preview" /></div>
      )}

      <main className="content-area">
        {/* Home */}
        {currentPage === 'home' && (
          <section className="page active"><div className="hero-section"><img src="1234.png" className="hero-logo" alt="Logo" /><h1 className="main-title decorated"><span>لمسة فن</span></h1><p className="hero-subtitle">حيث ينتهي التقليد.. يبدأ الإبداع. لمسة فن: بصمتك الاستثنائية في عالمٍ من الألوان</p><div className="hero-cta-row"><button className="pulse-button" data-testid="hero-cta-btn" onClick={() => navigateTo('gallery')}>استعرض أعمالنا</button><button className="pulse-button outline" data-testid="hero-orders-btn" onClick={() => navigateTo('orders')}><i className="fas fa-box"></i> الطلبات</button></div></div></section>
        )}

        {/* Gallery */}
        {currentPage === 'gallery' && (
          <section className="page active">
            <h2 className="section-header glow-text">تصفح اعمالنا التي لا مثيل لها</h2>
            <p className="hero-subtitle center-text">ابحث بين الاقسام</p>
            <div className="filter-container">
              <select value={selectedCategory} onChange={(e) => { playClick(); setSelectedCategory(e.target.value); }} className="category-select" data-testid="gallery-category-select">
                <option value="الكل">الكل</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="dynamic-grid">
              {filteredWorks.map(item => (
                <div key={item.id} className="product-card">
                  <img src={item.image_url} alt={item.title} onClick={() => setLightboxImage(item.image_url)} />
                  <div className="card-content"><span className="category-label">{item.category || 'آخر'}</span><h3>{item.title}</h3><p className="rich-text">{renderRich(item.description)}</p></div>
                </div>
              ))}
              {filteredWorks.length === 0 && <p className="no-data">لا توجد أعمال</p>}
            </div>
          </section>
        )}

        {/* Orders - الطلبات */}
        {currentPage === 'orders' && (
          <section className="page active">
            <h2 className="section-header glow-text">الطلبات</h2>
            <p className="hero-subtitle center-text">للحفاظ على خصوصية العميل — ابحث باسم العميل أو رقم هاتفه ثم اضغط زر البحث</p>

            <div className="orders-search-bar enhanced">
              <i className="fas fa-search"></i>
              <input
                type="text"
                data-testid="orders-search-input"
                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { playClick(); setOrdersSubmitted(true); } }}
              />
              {ordersSearch && (
                <button className="clear-search" data-testid="orders-clear-search" onClick={() => { setOrdersSearch(''); setOrdersSubmitted(false); }}><i className="fas fa-times"></i></button>
              )}
              <button
                className="orders-search-btn"
                data-testid="orders-search-btn"
                onClick={() => { playClick(); if (ordersSearch.trim()) { setOrdersSubmitted(true); } else { showToast('اكتب اسم العميل أو رقم الهاتف للبحث'); } }}
              >
                <i className="fas fa-search"></i> بحث
              </button>
            </div>

            {!ordersSubmitted && (
              <div className="orders-empty-state">
                <i className="fas fa-lock"></i>
                <h3>الطلبات محمية</h3>
                <p>يرجى كتابة اسمك او رقمك و الضغط على زر البحث لظهور جميع طلباتك</p>
              </div>
            )}

            {ordersSubmitted && (
              <div className="orders-grid">
                {filteredOrders.map(order => {
                  const st = getStatusInfo(order.status);
                  return (
                    <div key={order.id} className={`order-card ${st.color}`} data-testid={`order-card-${order.id}`}>
                      <div className="order-image" onClick={() => setLightboxImage(order.image_url)}>
                        <img src={order.image_url} alt={order.customer_name} />
                        <div className="order-overlay"><i className="fas fa-search-plus"></i></div>
                        <span className={`order-status-badge ${st.color}`}><i className={st.icon}></i> {st.label}</span>
                      </div>
                      <div className="order-card-body">
                        <span className="order-category">{order.category}</span>
                        <h3 className="order-customer"><i className="fas fa-user"></i> {order.customer_name}</h3>
                        <p className="order-phone"><i className="fas fa-phone"></i> {order.phone}</p>
                        {order.description && <div className="order-desc rich-text">{renderRich(order.description)}</div>}
                        <div className="order-meta">
                          <div className="order-meta-item">
                            <span className="meta-label"><i className="fas fa-calendar-alt"></i> تاريخ الانتهاء</span>
                            <span className="meta-value">{formatDate(order.expiry_date)}</span>
                          </div>
                          <div className="order-meta-item">
                            <span className="meta-label"><i className="fas fa-coins"></i> المتبقي</span>
                            <span className="meta-value amount">{formatAmount(order.remaining_amount)} ل.س</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <p className="no-data">لا توجد نتائج مطابقة لبحثك</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Contact */}
        {currentPage === 'contact' && (
          <section className="page active">
            <div className="contact-container">
              <div className="contact-info-row glass-box"><div className="info-card"><i className="fas fa-map-marker-alt"></i> حلب - باب النصر - امام الباب الاثري</div><div className="info-card"><i className="fas fa-phone"></i> 0980428648</div></div>

              <div className="form-card1">
                <div className="form-card2">
                  <form className="form" onSubmit={(e) => { e.preventDefault(); submitContact(); }}>
                    <p className="form-heading">ارسل رسالتك او مشكلتك</p>

                    <div className="form-field">
                      <input
                        required
                        placeholder="اسمك"
                        className="input-field"
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        data-testid="contact-name-input"
                      />
                    </div>

                    <div className="form-field">
                      <input
                        required
                        placeholder="رقم هاتفك"
                        className="input-field"
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        data-testid="contact-phone-input"
                      />
                    </div>

                    <div className="form-field">
                      <textarea
                        required
                        placeholder="رسالتك او استفسارك"
                        cols="30"
                        rows="3"
                        className="input-field"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        data-testid="contact-message-input"
                      ></textarea>
                    </div>

                    <button type="submit" className="sendMessage-btn" data-testid="contact-submit-btn">Send Message</button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* About */}
        {currentPage === 'about' && (
          <section className="page active">
            <h2 className="section-header glow-text">معلومات عننا</h2>
            <div className="about-container">
              <div className={`about-artistic-card ${aboutCardActive ? 'active' : ''}`} onClick={() => { playClick(); setAboutCardActive(!aboutCardActive); }}>
                <div className="artistic-bg-circles">
                  <span className="circle c1"></span><span className="circle c2"></span><span className="circle c3"></span><span className="circle c4"></span><span className="circle c5"></span>
                </div>
                <div className="about-artistic-content">
                  <div className={`about-logo-artistic ${aboutCardActive ? 'active' : ''}`}>
                    <img src={aboutSettings.image_url || "1234.png"} alt="Logo" />
                  </div>
                  <h3 className={aboutCardActive ? 'show' : ''}>{aboutSettings.title || 'لمسة فن'}</h3>
                  <p className={aboutCardActive ? 'show rich-text' : 'rich-text'}>{aboutSettings.description ? renderRich(aboutSettings.description) : 'نحن متخصصون في تصميم وطباعة جميع أنواع المطبوعات بأعلى جودة وأفضل الأسعار.'}</p>
                  {aboutSettings.button_text && (
                    <button className={`artistic-btn ${aboutCardActive ? 'show' : ''}`} onClick={(e) => { e.stopPropagation(); playClick(); if (aboutSettings.button_link) window.open(aboutSettings.button_link, '_blank'); }}>
                      {aboutSettings.button_text}
                    </button>
                  )}
                </div>
              </div>
              <p className="about-hint">اضغط على البطاقة للمزيد</p>

              <h4 className="social-title">تابعنا على</h4>
              <div className="social-links">
                {socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link-wrapper" onClick={playClick}>
                    <span className="social-link" title={link.platform}><i className={link.icon}></i></span>
                    <span className="social-link-label">{link.platform}</span>
                  </a>
                ))}
                {socialLinks.length === 0 && <p className="no-data-small">لا توجد روابط</p>}
              </div>
            </div>
          </section>
        )}

        {/* Updates */}
        {currentPage === 'updates' && (
          <section className="page active">
            <h2 className="section-header glow-text">التحديثات</h2>
            <p className="hero-subtitle center-text">آخر التحديثات والإصدارات</p>
            <div className="updates-list">
              {updates.map(update => (
                <div key={update.id} className="update-card glass-box"><div className="update-version">{update.version}</div><h3 className="update-title">{update.title}</h3><div className="update-desc rich-text">{renderRich(update.description)}</div></div>
              ))}
              {updates.length === 0 && <p className="no-data">لا توجد تحديثات حالياً</p>}
            </div>
          </section>
        )}

        {/* Admin */}
        {currentPage === 'admin' && isLoggedIn && (
          <section className="page active">
            <div className="admin-dashboard glass-box">
              <div className="admin-nav-internal">
                <button className="logout-btn" data-testid="logout-btn" onClick={handleLogout}>خروج آمن <i className="fas fa-sign-out-alt"></i></button>
                <div className="admin-tabs">
                  <button className={`tab-link ${adminTab === 'works' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('works'); }}>إدارة الأعمال</button>
                  <button className={`tab-link ${adminTab === 'mytasks' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('mytasks'); }}>إدارة أعمالي</button>
                  <button className={`tab-link ${adminTab === 'orders' ? 'active' : ''}`} data-testid="admin-tab-orders" onClick={() => { playClick(); setAdminTab('orders'); }}>إدارة الطلبات</button>
                  <button className={`tab-link ${adminTab === 'messages' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('messages'); }}>صندوق الرسائل</button>
                  <button className={`tab-link ${adminTab === 'updates' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('updates'); }}>إعدادات التحديثات</button>
                  <button className={`tab-link ${adminTab === 'announcements' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('announcements'); }}>الإعلانات</button>
                  <button className={`tab-link ${adminTab === 'social' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('social'); }}>روابط التواصل</button>
                  <button className={`tab-link ${adminTab === 'aboutsettings' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('aboutsettings'); }}>إعدادات عننا</button>
                </div>
              </div>

              <div className="admin-content">
                {/* Works Tab */}
                {adminTab === 'works' && (
                  <div>
                    <div className="admin-form glass-box">
                      <h4>{editingWork ? 'تعديل العمل' : 'إضافة عمل جديد'}</h4>
                      <input type="text" placeholder="عنوان العمل" value={editingWork ? editingWork.title : newWork.title} onChange={(e) => editingWork ? setEditingWork({...editingWork, title: e.target.value}) : setNewWork({...newWork, title: e.target.value})} />
                      <textarea placeholder="وصف العمل" value={editingWork ? editingWork.description : newWork.description} onChange={(e) => editingWork ? setEditingWork({...editingWork, description: e.target.value}) : setNewWork({...newWork, description: e.target.value})} />
                      <select className="category-select full-width" value={editingWork ? editingWork.category : newWork.category} onChange={(e) => editingWork ? setEditingWork({...editingWork, category: e.target.value}) : setNewWork({...newWork, category: e.target.value})}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="file-upload-container">
                        <label className="file-upload-label"><i className="fas fa-cloud-upload-alt"></i> {editingWork ? (editWorkImage ? editWorkImage.name : 'اختر صورة جديدة') : (newWorkImage ? newWorkImage.name : 'اختر صورة العمل')}<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) editingWork ? setEditWorkImage(f) : setNewWorkImage(f); }} style={{ display: 'none' }} /></label>
                        {editingWork && editingWork.image_url && <img src={editingWork.image_url} alt="Current" className="preview-image" />}
                      </div>
                      <div className="modal-actions">
                        <button className="submit-btn" onClick={editingWork ? updateWork : createWork} disabled={uploading}>{uploading ? 'جاري الرفع...' : (editingWork ? 'حفظ التعديلات' : 'إضافة العمل')}</button>
                        {editingWork && <button className="cancel-btn" onClick={() => { playClick(); setEditingWork(null); setEditWorkImage(null); }}>إلغاء</button>}
                      </div>
                    </div>
                    <div className="admin-grid">
                      {works.map(item => (
                        <div key={item.id} className="product-card">
                          <img src={item.image_url} alt={item.title} onClick={() => setLightboxImage(item.image_url)} />
                          <div className="card-content"><h4>{item.title}</h4><span className="category-label">{item.category || 'آخر'}</span></div>
                          <div className="card-actions"><button className="btn-edit" onClick={() => { playClick(); setEditingWork(item); }}>تعديل</button><button className="btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'work', id: item.id }); }}>حذف</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Tasks Tab */}
                {adminTab === 'mytasks' && (
                  <div className="mytasks-section">
                    <div className="admin-form glass-box">
                      <h4>{editingTask ? 'تعديل العمل' : 'إضافة عمل جديد'}</h4>
                      <select className="category-select full-width" value={editingTask ? editingTask.category : newTask.category} onChange={(e) => editingTask ? setEditingTask({...editingTask, category: e.target.value}) : setNewTask({...newTask, category: e.target.value})}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <input type="text" placeholder="عنوان العمل" value={editingTask ? editingTask.title : newTask.title} onChange={(e) => editingTask ? setEditingTask({...editingTask, title: e.target.value}) : setNewTask({...newTask, title: e.target.value})} />
                      <textarea placeholder="وصف العمل / ملاحظات" value={editingTask ? editingTask.description : newTask.description} onChange={(e) => editingTask ? setEditingTask({...editingTask, description: e.target.value}) : setNewTask({...newTask, description: e.target.value})} />
                      <div className="file-upload-container">
                        <label className="file-upload-label"><i className="fas fa-image"></i> {editingTask ? (editTaskImage ? editTaskImage.name : 'اختر صورة جديدة') : (newTaskImage ? newTaskImage.name : 'اختر صورة العمل')}<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) editingTask ? setEditTaskImage(f) : setNewTaskImage(f); }} style={{ display: 'none' }} /></label>
                        {editingTask && editingTask.image_url && <img src={editingTask.image_url} alt="Current" className="preview-image" onClick={() => setLightboxImage(editingTask.image_url)} />}
                      </div>
                      <div className="modal-actions">
                        <button className="submit-btn" onClick={editingTask ? updateMyTask : createMyTask} disabled={uploading}>{uploading ? 'جاري الرفع...' : (editingTask ? 'حفظ التعديلات' : 'إضافة العمل')}</button>
                        {editingTask && <button className="cancel-btn" onClick={() => { playClick(); setEditingTask(null); setEditTaskImage(null); }}>إلغاء</button>}
                      </div>
                    </div>

                    <div className="mytasks-tabs">
                      <button className={`mytask-tab ${myTasksTab === 'pending' ? 'active pending' : ''}`} onClick={() => { playClick(); setMyTasksTab('pending'); }}><i className="fas fa-clock"></i> غير منتهية ({myTasks.filter(t => t.status === 'pending').length})</button>
                      <button className={`mytask-tab ${myTasksTab === 'completed' ? 'active completed' : ''}`} onClick={() => { playClick(); setMyTasksTab('completed'); }}><i className="fas fa-check-circle"></i> منتهية ({myTasks.filter(t => t.status === 'completed').length})</button>
                      <button className={`mytask-tab ${myTasksTab === 'printing' ? 'active printing' : ''}`} onClick={() => { playClick(); setMyTasksTab('printing'); }}><i className="fas fa-print"></i> بالطباعة ({myTasks.filter(t => t.status === 'printing').length})</button>
                    </div>

                    <div className="mytasks-grid">
                      {filteredTasks.map(task => (
                        <div key={task.id} className={`mytask-card ${task.status}`}>
                          <div className="mytask-image" onClick={() => setLightboxImage(task.image_url)}>
                            <img src={task.image_url} alt={task.title} />
                            <div className="mytask-overlay"><i className="fas fa-search-plus"></i></div>
                          </div>
                          <div className="mytask-content">
                            <span className="mytask-category">{task.category}</span>
                            <h4>{task.title}</h4>
                            <p className="rich-text">{renderRich(task.description)}</p>
                          </div>
                          <div className="mytask-actions">
                            {task.status === 'pending' && (
                              <>
                                <button className="btn-sm btn-edit" onClick={() => { playClick(); setEditingTask(task); }}>تعديل</button>
                                <button className="btn-sm btn-complete" onClick={() => changeTaskStatus(task.id, 'completed')}><i className="fas fa-check"></i> انتهاء</button>
                                <button className="btn-sm btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'mytask', id: task.id }); }}>حذف</button>
                              </>
                            )}
                            {task.status === 'completed' && (
                              <>
                                <button className="btn-sm btn-edit" onClick={() => { playClick(); setEditingTask(task); }}>تعديل</button>
                                <button className="btn-sm btn-print" onClick={() => changeTaskStatus(task.id, 'printing')}><i className="fas fa-print"></i> بالطباعة</button>
                              </>
                            )}
                            {task.status === 'printing' && (
                              <button className="btn-sm btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'mytask', id: task.id }); }}>حذف</button>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredTasks.length === 0 && <p className="no-data">لا توجد أعمال في هذا القسم</p>}
                    </div>
                  </div>
                )}

                {/* Orders Admin Tab - إدارة الطلبات */}
                {adminTab === 'orders' && (
                  <div className="orders-admin-section">
                    <div className="admin-form glass-box">
                      <h4>{editingOrder ? 'تعديل الطلب' : 'إضافة طلب جديد'}</h4>

                      <div className="file-upload-container">
                        <label className="file-upload-label"><i className="fas fa-image"></i> {editingOrder ? (editOrderImage ? editOrderImage.name : 'اختر صورة جديدة') : (newOrderImage ? newOrderImage.name : 'اختر صورة التصميم')}<input type="file" accept="image/*" data-testid="order-image-input" onChange={(e) => { const f = e.target.files[0]; if (f) editingOrder ? setEditOrderImage(f) : setNewOrderImage(f); }} style={{ display: 'none' }} /></label>
                        {editingOrder && editingOrder.image_url && <img src={editingOrder.image_url} alt="Current" className="preview-image" onClick={() => setLightboxImage(editingOrder.image_url)} />}
                      </div>

                      <input type="text" data-testid="order-customer-name" placeholder="اسم العميل" value={editingOrder ? editingOrder.customer_name : newOrder.customer_name} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, customer_name: e.target.value}) : setNewOrder({...newOrder, customer_name: e.target.value})} />

                      <input type="tel" data-testid="order-phone" placeholder="رقم الهاتف" value={editingOrder ? editingOrder.phone : newOrder.phone} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, phone: e.target.value}) : setNewOrder({...newOrder, phone: e.target.value})} />

                      <textarea data-testid="order-description" placeholder="وصف الطلب" value={editingOrder ? (editingOrder.description || '') : newOrder.description} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, description: e.target.value}) : setNewOrder({...newOrder, description: e.target.value})} />

                      <select className="category-select full-width" data-testid="order-category" value={editingOrder ? editingOrder.category : newOrder.category} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, category: e.target.value}) : setNewOrder({...newOrder, category: e.target.value})}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>

                      <div className="form-row">
                        <div className="form-field">
                          <label className="field-label"><i className="fas fa-calendar-alt"></i> تاريخ الانتهاء</label>
                          <input type="date" data-testid="order-expiry-date" value={editingOrder ? (editingOrder.expiry_date ? editingOrder.expiry_date.split('T')[0] : '') : newOrder.expiry_date} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, expiry_date: e.target.value}) : setNewOrder({...newOrder, expiry_date: e.target.value})} />
                        </div>
                        <div className="form-field">
                          <label className="field-label"><i className="fas fa-coins"></i> المبلغ المتبقي (ل.س)</label>
                          <input type="number" min="0" step="any" data-testid="order-remaining-amount" placeholder="0" value={editingOrder ? (editingOrder.remaining_amount ?? '') : newOrder.remaining_amount} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, remaining_amount: e.target.value}) : setNewOrder({...newOrder, remaining_amount: e.target.value})} />
                        </div>
                      </div>

                      <label className="field-label"><i className="fas fa-tasks"></i> حالة الطلب</label>
                      <select className="category-select full-width" data-testid="order-status" value={editingOrder ? editingOrder.status : newOrder.status} onChange={(e) => editingOrder ? setEditingOrder({...editingOrder, status: e.target.value}) : setNewOrder({...newOrder, status: e.target.value})}>
                        {orderStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>

                      <div className="modal-actions">
                        <button className="submit-btn" data-testid="order-submit-btn" onClick={editingOrder ? updateOrder : createOrder} disabled={uploading}>{uploading ? 'جاري الرفع...' : (editingOrder ? 'حفظ التعديلات' : 'إضافة الطلب')}</button>
                        {editingOrder && <button className="cancel-btn" onClick={() => { playClick(); setEditingOrder(null); setEditOrderImage(null); }}>إلغاء</button>}
                      </div>
                    </div>

                    <div className="orders-grid admin">
                      {orders.map(order => {
                        const st = getStatusInfo(order.status);
                        return (
                          <div key={order.id} className={`order-card ${st.color}`}>
                            <div className="order-image" onClick={() => setLightboxImage(order.image_url)}>
                              <img src={order.image_url} alt={order.customer_name} />
                              <div className="order-overlay"><i className="fas fa-search-plus"></i></div>
                              <span className={`order-status-badge ${st.color}`}><i className={st.icon}></i> {st.label}</span>
                            </div>
                            <div className="order-card-body">
                              <span className="order-category">{order.category}</span>
                              <h3 className="order-customer"><i className="fas fa-user"></i> {order.customer_name}</h3>
                              <p className="order-phone"><i className="fas fa-phone"></i> {order.phone}</p>
                              {order.description && <div className="order-desc rich-text">{renderRich(order.description)}</div>}
                              <div className="order-meta">
                                <div className="order-meta-item">
                                  <span className="meta-label"><i className="fas fa-calendar-alt"></i> الانتهاء</span>
                                  <span className="meta-value">{formatDate(order.expiry_date)}</span>
                                </div>
                                <div className="order-meta-item">
                                  <span className="meta-label"><i className="fas fa-coins"></i> المتبقي</span>
                                  <span className="meta-value amount">{formatAmount(order.remaining_amount)} ل.س</span>
                                </div>
                              </div>
                              <div className="order-actions">
                                <button className="btn-sm btn-edit" data-testid={`order-edit-${order.id}`} onClick={() => { playClick(); setEditingOrder(order); }}>تعديل</button>
                                <button className="btn-sm btn-delete" data-testid={`order-delete-${order.id}`} onClick={() => { playClick(); setDeleteModal({ show: true, type: 'order', id: order.id }); }}>حذف</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && <p className="no-data">لا توجد طلبات حالياً</p>}
                    </div>
                  </div>
                )}

                {/* Messages Tab */}
                {adminTab === 'messages' && (
                  <div>
                    {messages.map(msg => (
                      <div key={msg.id} className="message-card glass-box"><p><strong>{msg.name}</strong> ({msg.phone})</p><p>{msg.message}</p><button className="btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'message', id: msg.id }); }}><i className="fas fa-trash"></i> حذف</button></div>
                    ))}
                    {messages.length === 0 && <p className="no-data">لا توجد رسائل</p>}
                  </div>
                )}

                {/* Updates Tab */}
                {adminTab === 'updates' && (
                  <div>
                    <div className="admin-form glass-box">
                      <h4>إضافة تحديث جديد</h4>
                      <input type="text" placeholder="إصدار التحديث (مثال: v1.0)" value={newUpdate.version} onChange={(e) => setNewUpdate({...newUpdate, version: e.target.value})} />
                      <input type="text" placeholder="عنوان التحديث" value={newUpdate.title} onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})} />
                      <textarea placeholder="وصف التحديث" value={newUpdate.description} onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})} />
                      <button className="submit-btn" onClick={createUpdate}>نشر التحديث</button>
                    </div>
                    <div className="updates-admin-list">
                      {updates.map(update => (
                        <div key={update.id} className="update-admin-card glass-box">
                          <div className="update-info"><span className="update-version">{update.version}</span><h4>{update.title}</h4><div className="rich-text">{renderRich(update.description)}</div></div>
                          <div className="update-actions"><button className="btn-edit" onClick={() => { playClick(); setEditingUpdate(update); }}>تعديل</button><button className="btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'update', id: update.id }); }}>حذف</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Announcements Tab */}
                {adminTab === 'announcements' && (
                  <div>
                    <div className="admin-form glass-box">
                      <h4>إضافة إعلان جديد</h4>
                      <input type="text" placeholder="عنوان الإعلان" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                      <textarea placeholder="وصف الإعلان" value={newAnnouncement.description} onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})} />
                      <input type="text" placeholder="نص الزر" value={newAnnouncement.button_text} onChange={(e) => setNewAnnouncement({...newAnnouncement, button_text: e.target.value})} />
                      <select value={newAnnouncement.button_link} onChange={(e) => setNewAnnouncement({...newAnnouncement, button_link: e.target.value})} className="category-select full-width">
                        <option value="">اختر الصفحة الهدف</option><option value="home">الرئيسية</option><option value="gallery">المعرض</option><option value="orders">الطلبات</option><option value="contact">تواصل معنا</option><option value="about">معلومات عننا</option><option value="updates">التحديثات</option>
                      </select>
                      <button className="submit-btn" onClick={createAnnouncement}>نشر الإعلان</button>
                    </div>
                    <div className="announcements-admin-list">
                      {announcements.map(ann => (
                        <div key={ann.id} className={`announcement-admin-card glass-box ${ann.is_active ? 'active' : 'inactive'}`}>
                          <div className="announcement-info"><span className={`status-badge ${ann.is_active ? 'active' : 'inactive'}`}>{ann.is_active ? 'مفعل' : 'متوقف'}</span><h4>{ann.title}</h4><p>{ann.description}</p><small>الزر: {ann.button_text} → {ann.button_link}</small></div>
                          <div className="announcement-actions"><button className={`btn-toggle ${ann.is_active ? 'active' : ''}`} onClick={() => toggleAnnouncementActive(ann)}>{ann.is_active ? 'إيقاف' : 'تفعيل'}</button><button className="btn-edit" onClick={() => { playClick(); setEditingAnnouncement(ann); }}>تعديل</button><button className="btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'announcement', id: ann.id }); }}>حذف</button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Tab */}
                {adminTab === 'social' && (
                  <div>
                    <div className="admin-form glass-box">
                      <h4>{editingSocial ? 'تعديل الرابط' : 'إضافة رابط جديد'}</h4>
                      <input type="text" placeholder="اسم المنصة" value={editingSocial ? editingSocial.platform : newSocial.platform} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, platform: e.target.value}) : setNewSocial({...newSocial, platform: e.target.value})} />
                      <input type="text" placeholder="رابط الحساب" value={editingSocial ? editingSocial.url : newSocial.url} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, url: e.target.value}) : setNewSocial({...newSocial, url: e.target.value})} />
                      <select className="category-select full-width" value={editingSocial ? editingSocial.icon : newSocial.icon} onChange={(e) => editingSocial ? setEditingSocial({...editingSocial, icon: e.target.value}) : setNewSocial({...newSocial, icon: e.target.value})}>
                        {socialIcons.map(icon => <option key={icon.value} value={icon.value}>{icon.label}</option>)}
                      </select>
                      <div className="modal-actions">
                        <button className="submit-btn" onClick={editingSocial ? updateSocialLink : createSocialLink}>{editingSocial ? 'حفظ التعديلات' : 'إضافة الرابط'}</button>
                        {editingSocial && <button className="cancel-btn" onClick={() => { playClick(); setEditingSocial(null); }}>إلغاء</button>}
                      </div>
                    </div>
                    <div className="social-admin-list">
                      {socialLinks.map(link => (
                        <div key={link.id} className="social-admin-card glass-box">
                          <div className="social-info"><h4><i className={link.icon}></i> {link.platform}</h4><small>{link.url}</small></div>
                          <div className="social-actions"><button className="btn-edit" onClick={() => { playClick(); setEditingSocial(link); }}>تعديل</button><button className="btn-delete" onClick={() => { playClick(); setDeleteModal({ show: true, type: 'social', id: link.id }); }}>حذف</button></div>
                        </div>
                      ))}
                      {socialLinks.length === 0 && <p className="no-data">لا توجد روابط</p>}
                    </div>
                  </div>
                )}

                {/* About Settings Tab */}
                {adminTab === 'aboutsettings' && (
                  <div>
                    <div className="admin-form glass-box">
                      <h4>إعدادات صفحة معلومات عننا</h4>
                      <div className="file-upload-container">
                        <label className="file-upload-label"><i className="fas fa-image"></i> {aboutImage ? aboutImage.name : 'اختر صورة'}<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) setAboutImage(f); }} style={{ display: 'none' }} /></label>
                        {aboutSettings.image_url && <img src={aboutSettings.image_url} alt="Current" className="preview-image" />}
                      </div>
                      <input type="text" placeholder="العنوان" value={aboutSettings.title || ''} onChange={(e) => setAboutSettings({...aboutSettings, title: e.target.value})} />
                      <textarea placeholder="الوصف" value={aboutSettings.description || ''} onChange={(e) => setAboutSettings({...aboutSettings, description: e.target.value})} />
                      <input type="text" placeholder="نص الزر" value={aboutSettings.button_text || ''} onChange={(e) => setAboutSettings({...aboutSettings, button_text: e.target.value})} />
                      <input type="text" placeholder="رابط الزر (URL)" value={aboutSettings.button_link || ''} onChange={(e) => setAboutSettings({...aboutSettings, button_link: e.target.value})} />
                      <button className="submit-btn" onClick={saveAboutSettings} disabled={uploading}>{uploading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Edit Update Modal */}
      {editingUpdate && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>تعديل التحديث</h3><input type="text" placeholder="إصدار التحديث" value={editingUpdate.version} onChange={(e) => setEditingUpdate({...editingUpdate, version: e.target.value})} /><input type="text" placeholder="عنوان التحديث" value={editingUpdate.title} onChange={(e) => setEditingUpdate({...editingUpdate, title: e.target.value})} /><textarea placeholder="وصف التحديث" value={editingUpdate.description} onChange={(e) => setEditingUpdate({...editingUpdate, description: e.target.value})} /><div className="modal-actions"><button className="submit-btn" onClick={updateUpdate}>حفظ التعديلات</button><button className="cancel-btn" onClick={() => { playClick(); setEditingUpdate(null); }}>إلغاء</button></div></div></div>
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>تعديل الإعلان</h3><input type="text" placeholder="عنوان الإعلان" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})} /><textarea placeholder="وصف الإعلان" value={editingAnnouncement.description} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, description: e.target.value})} /><input type="text" placeholder="نص الزر" value={editingAnnouncement.button_text} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_text: e.target.value})} /><select value={editingAnnouncement.button_link} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_link: e.target.value})} className="category-select full-width"><option value="">اختر الصفحة</option><option value="home">الرئيسية</option><option value="gallery">المعرض</option><option value="orders">الطلبات</option><option value="contact">تواصل معنا</option><option value="about">معلومات عننا</option><option value="updates">التحديثات</option></select><div className="modal-actions"><button className="submit-btn" onClick={updateAnnouncement}>حفظ التعديلات</button><button className="cancel-btn" onClick={() => { playClick(); setEditingAnnouncement(null); }}>إلغاء</button></div></div></div>
      )}

      <a href="https://wa.me/963980428648" className="whatsapp-float" target="_blank" rel="noopener noreferrer" onClick={playClick}><i className="fab fa-whatsapp"></i></a>
    </div>
  );
}

export default App;

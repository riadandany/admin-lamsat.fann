import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pntqobqhaggvcjtyspvb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudHFvYnFoYWdndmNqdHlzcHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjYwNjQsImV4cCI6MjA5MTUwMjA2NH0.fdl8d8I0UoDyWGDPK0VNUZBaEBQD4cz-ReowhbtxH0k";

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
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      checkAnnouncements();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAnnouncements = async () => {
    const seen = JSON.parse(localStorage.getItem('seenAnnouncements') || '[]');
    try {
      const response = await axios.get(`${API}/announcements/active`);
      const unseen = response.data.find(a => !seen.includes(a.id));
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

  const supabaseFetch = async (endpoint, options = {}) => {
    return await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...options.headers }
    });
  };

  const uploadImage = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${fileName}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
      body: file
    });
    if (response.ok) return `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
    throw new Error('Upload failed');
  };

  const fetchUpdates = async () => { try { const r = await const { data, error } = await supabase
  .from('updates')
  .select('*'); setUpdates(r.data); } catch (e) {} };
  const fetchAnnouncements = async () => { try { const r = await axios.get(`${API}/announcements`); setAnnouncements(r.data); } catch (e) {} };
  const fetchWorks = async () => { try { const r = await supabaseFetch('images?select=*&order=created_at.desc'); setWorks(await r.json() || []); } catch (e) {} };
  const fetchSocialLinks = async () => { try { const r = await axios.get(`${API}/social-links`); setSocialLinks(r.data); } catch (e) {} };
  const fetchMessages = async () => { try { const r = await supabaseFetch('messages?select=*&order=created_at.desc'); setMessages(await r.json() || []); } catch (e) {} };
  const fetchMyTasks = async () => { try { const r = await axios.get(`${API}/my-tasks`); setMyTasks(r.data); } catch (e) {} };
  const fetchAboutSettings = async () => { try { const r = await axios.get(`${API}/about-settings`); setAboutSettings(r.data); } catch (e) {} };

  useEffect(() => {
    if (currentPage === 'updates') fetchUpdates();
    if (currentPage === 'gallery') fetchWorks();
    if (currentPage === 'about') { fetchSocialLinks(); fetchAboutSettings(); }
    if (currentPage === 'admin' && isLoggedIn) {
      fetchWorks(); fetchMessages(); fetchUpdates(); fetchAnnouncements(); fetchSocialLinks(); fetchMyTasks(); fetchAboutSettings();
    }
  }, [currentPage, isLoggedIn, adminTab]);

  const handleLogin = async () => {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (data) {
    setIsLoggedIn(true);
  } else {
    alert("Login failed");
  }
}; setShowLoginModal(false); setCurrentPage('admin'); showToast('مرحباً أيها المطور'); setUsername(''); setPassword(''); }
    } catch (e) { showToast('اسم المستخدم أو كلمة المرور خاطئة!'); }
  };

  const handleLogout = () => { playClick(); setIsLoggedIn(false); setCurrentPage('home'); showToast('تم تسجيل الخروج بنجاح'); };

  // Works CRUD
  const createWork = async () => {
    playClick();
    if (!newWork.title || !newWorkImage) { showToast('أكمل البيانات واختر صورة'); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newWorkImage);
      await supabaseFetch('images', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ title: newWork.title, description: newWork.description, category: newWork.category, image_url: imageUrl }) });
      showToast('تم إضافة العمل'); setNewWork({ title: '', description: '', category: 'كرت فيزيت' }); setNewWorkImage(null); fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const updateWork = async () => {
    playClick(); if (!editingWork) return; setUploading(true);
    try {
      let imageUrl = editingWork.image_url;
      if (editWorkImage) imageUrl = await uploadImage(editWorkImage);
      await supabaseFetch(`images?id=eq.${editingWork.id}`, { method: 'PATCH', body: JSON.stringify({ title: editingWork.title, description: editingWork.description, category: editingWork.category, image_url: imageUrl }) });
      showToast('تم تحديث العمل'); setEditingWork(null); setEditWorkImage(null); fetchWorks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const deleteWork = async (id) => { try { await supabaseFetch(`images?id=eq.${id}`, { method: 'DELETE' }); showToast('تم حذف العمل'); fetchWorks(); } catch (e) { showToast('حدث خطأ'); } };

  // My Tasks CRUD
  const createMyTask = async () => {
    playClick();
    if (!newTask.title || !newTaskImage) { showToast('أكمل البيانات واختر صورة'); return; }
    setUploading(true);
    try {
      const imageUrl = await uploadImage(newTaskImage);
      await axios.post(`${API}/my-tasks`, { title: newTask.title, description: newTask.description, category: newTask.category, image_url: imageUrl, status: 'pending' });
      showToast('تم إضافة العمل'); setNewTask({ title: '', description: '', category: 'كرت فيزيت' }); setNewTaskImage(null); fetchMyTasks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const updateMyTask = async () => {
    playClick(); if (!editingTask) return; setUploading(true);
    try {
      let imageUrl = editingTask.image_url;
      if (editTaskImage) imageUrl = await uploadImage(editTaskImage);
      await axios.put(`${API}/my-tasks/${editingTask.id}`, { title: editingTask.title, description: editingTask.description, category: editingTask.category, image_url: imageUrl });
      showToast('تم تحديث العمل'); setEditingTask(null); setEditTaskImage(null); fetchMyTasks();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  const changeTaskStatus = async (id, newStatus) => {
    playClick();
    try { await axios.put(`${API}/my-tasks/${id}`, { status: newStatus }); showToast('تم تحديث الحالة'); fetchMyTasks(); } catch (e) { showToast('حدث خطأ'); }
  };

  const deleteMyTask = async (id) => { try { await axios.delete(`${API}/my-tasks/${id}`); showToast('تم حذف العمل'); fetchMyTasks(); } catch (e) { showToast('حدث خطأ'); } };

  // About Settings
  const saveAboutSettings = async () => {
    playClick(); setUploading(true);
    try {
      let imageUrl = aboutSettings.image_url;
      if (aboutImage) imageUrl = await uploadImage(aboutImage);
      await axios.post(`${API}/about-settings`, { ...aboutSettings, image_url: imageUrl });
      showToast('تم حفظ الإعدادات'); setAboutImage(null); fetchAboutSettings();
    } catch (e) { showToast('حدث خطأ'); }
    setUploading(false);
  };

  // Updates CRUD
  const createUpdate = async () => { playClick(); if (!newUpdate.version || !newUpdate.title) { showToast('أكمل البيانات'); return; } try { await supabase
  .from("updates")
  .insert([newUpdate]); showToast('تم إضافة التحديث'); setNewUpdate({ version: '', title: '', description: '' }); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };
  const updateUpdate = async () => { playClick(); if (!editingUpdate) return; try { await supabase
  .from("updates")
  .update(updatedData)
  .eq("id", updatedData.id); showToast('تم تحديث التحديث'); setEditingUpdate(null); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteUpdate = async (id) => { try { await supabase
  .from("updates")
  .delete()
  .eq("id", id); showToast('تم حذف التحديث'); fetchUpdates(); } catch (e) { showToast('حدث خطأ'); } };

  // Announcements CRUD
  const createAnnouncement = async () => { playClick(); if (!newAnnouncement.title || !newAnnouncement.button_text) { showToast('أكمل البيانات'); return; } try { await axios.post(`${API}/announcements`, { ...newAnnouncement, is_active: true }); showToast('تم إضافة الإعلان'); setNewAnnouncement({ title: '', description: '', button_text: '', button_link: '' }); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const updateAnnouncement = async () => { playClick(); if (!editingAnnouncement) return; try { await axios.put(`${API}/announcements/${editingAnnouncement.id}`, editingAnnouncement); showToast('تم تحديث الإعلان'); setEditingAnnouncement(null); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteAnnouncement = async (id) => { try { await axios.delete(`${API}/announcements/${id}`); showToast('تم حذف الإعلان'); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };
  const toggleAnnouncementActive = async (ann) => { playClick(); try { await axios.put(`${API}/announcements/${ann.id}`, { is_active: !ann.is_active }); showToast(ann.is_active ? 'تم إيقاف الإعلان' : 'تم تفعيل الإعلان'); fetchAnnouncements(); } catch (e) { showToast('حدث خطأ'); } };

  // Social Links CRUD
  const createSocialLink = async () => { playClick(); if (!newSocial.platform || !newSocial.url) { showToast('أكمل البيانات'); return; } try { await axios.post(`${API}/social-links`, newSocial); showToast('تم إضافة الرابط'); setNewSocial({ platform: '', url: '', icon: 'fab fa-facebook' }); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };
  const updateSocialLink = async () => { playClick(); if (!editingSocial) return; try { await axios.put(`${API}/social-links/${editingSocial.id}`, editingSocial); showToast('تم تحديث الرابط'); setEditingSocial(null); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };
  const deleteSocialLink = async (id) => { try { await axios.delete(`${API}/social-links/${id}`); showToast('تم حذف الرابط'); fetchSocialLinks(); } catch (e) { showToast('حدث خطأ'); } };

  // Contact
  const submitContact = async () => { playClick(); if (!contactName || !contactPhone) { showToast('أكمل البيانات'); return; } try { await supabaseFetch('messages', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ name: contactName, phone: contactPhone, message: contactMessage }) }); showToast('تم إرسال رسالتك'); setContactName(''); setContactPhone(''); setContactMessage(''); } catch (e) { showToast('حدث خطأ'); } };
  const deleteMessage = async (id) => { try { await supabaseFetch(`messages?id=eq.${id}`, { method: 'DELETE' }); showToast('تم حذف الرسالة'); fetchMessages(); } catch (e) { showToast('حدث خطأ'); } };

  const confirmDelete = () => {
    playClick();
    if (deleteModal.type === 'update') deleteUpdate(deleteModal.id);
    else if (deleteModal.type === 'announcement') deleteAnnouncement(deleteModal.id);
    else if (deleteModal.type === 'work') deleteWork(deleteModal.id);
    else if (deleteModal.type === 'social') deleteSocialLink(deleteModal.id);
    else if (deleteModal.type === 'message') deleteMessage(deleteModal.id);
    else if (deleteModal.type === 'mytask') deleteMyTask(deleteModal.id);
    setDeleteModal({ show: false, type: '', id: '' });
  };

  const filteredWorks = selectedCategory === 'الكل' ? works : works.filter(w => w.category === selectedCategory);
  const filteredTasks = myTasks.filter(t => t.status === myTasksTab);

  const navigateTo = (page) => { playClick(); setCurrentPage(page); setMobileMenuOpen(false); };

  return (
    <div className="app" dir="rtl">
      <audio ref={audioRef} src={CLICK_SOUND_URL} preload="auto" />

      {showIntro && (
        <div className="intro-overlay"><div className="intro-content"><h1 className="glitch-title">LAMSAT FANN</h1><div className="luxury-line"></div><p className="reveal-text">أهلاً بك في عالم التصميم.. حيث تضيع الحدود بين الخيال والواقع</p></div></div>
      )}

      {showAnnouncement && activeAnnouncement && (
        <div className="modal-overlay"><div className="announcement-box"><div className="announcement-icon"><i className="fas fa-bullhorn"></i></div><h3 className="announcement-title">{activeAnnouncement.title}</h3><p className="announcement-desc">{activeAnnouncement.description}</p><div className="announcement-actions"><button className="announcement-btn primary" onClick={() => { playClick(); dismissAnnouncement(); if (activeAnnouncement.button_link) navigateTo(activeAnnouncement.button_link); }}>{activeAnnouncement.button_text}</button><button className="announcement-btn secondary" onClick={() => { playClick(); dismissAnnouncement(); }}>إغلاق</button></div></div></div>
      )}

      {toast && <div className="toast-container"><div className="toast"><i className="fas fa-info-circle"></i> {toast}</div></div>}

      <nav className="luxury-nav">
        <button className="mobile-menu-btn" onClick={() => { playClick(); setMobileMenuOpen(!mobileMenuOpen); }}><i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i></button>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <button className="nav-btn" onClick={() => navigateTo('home')}>الرئيسية</button>
          <button className="nav-btn" onClick={() => navigateTo('gallery')}>المعرض</button>
          <button className="nav-btn" onClick={() => navigateTo('contact')}>تواصل معنا</button>
          <button className="nav-btn" onClick={() => navigateTo('about')}>معلومات عننا</button>
          <button className="nav-btn" onClick={() => navigateTo('updates')}>التحديثات</button>
          <button className="gear-btn" onClick={() => { playClick(); isLoggedIn ? navigateTo('admin') : setShowLoginModal(true); }}><i className="fas fa-cog"></i> المطور</button>
        </div>
      </nav>

      {showLoginModal && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>دخول المطور</h3><input type="text" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} /><input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} /><div className="modal-actions"><button className="submit-btn" onClick={handleLogin}>دخول</button><button className="cancel-btn" onClick={() => { playClick(); setShowLoginModal(false); }}>إلغاء</button></div></div></div>
      )}

      {deleteModal.show && (
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>تأكيد الحذف</h3><p>هل أنت متأكد من الحذف؟</p><div className="modal-actions"><button className="btn-delete" onClick={confirmDelete}>حذف</button><button className="cancel-btn" onClick={() => { playClick(); setDeleteModal({ show: false, type: '', id: '' }); }}>إلغاء</button></div></div></div>
      )}

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}><span className="close-lightbox" onClick={() => setLightboxImage(null)}>✕</span><img src={lightboxImage} alt="Preview" /></div>
      )}

      <main className="content-area">
        {/* Home */}
        {currentPage === 'home' && (
          <section className="page active"><div className="hero-section"><img src="https://customer-assets.emergentagent.com/job_2f9a6599-6bc4-4224-8bce-b59cd468f774/artifacts/1775941528753.png" className="hero-logo" alt="Logo" /><h1 className="main-title decorated"><span>لمسة فن</span></h1><p className="hero-subtitle">حيث ينتهي التقليد.. يبدأ الإبداع. لمسة فن: بصمتك الاستثنائية في عالمٍ من الألوان</p><button className="pulse-button" onClick={() => navigateTo('gallery')}>استعرض أعمالنا</button></div></section>
        )}

        {/* Gallery */}
        {currentPage === 'gallery' && (
          <section className="page active">
            <h2 className="section-header glow-text">تصفح اعمالنا التي لا مثيل لها</h2>
            <p className="hero-subtitle center-text">ابحث بين الاقسام</p>
            <div className="filter-container">
              <select value={selectedCategory} onChange={(e) => { playClick(); setSelectedCategory(e.target.value); }} className="category-select">
                <option value="الكل">الكل</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="dynamic-grid">
              {filteredWorks.map(item => (
                <div key={item.id} className="product-card">
                  <img src={item.image_url} alt={item.title} onClick={() => setLightboxImage(item.image_url)} />
                  <div className="card-content"><span className="category-label">{item.category || 'آخر'}</span><h3>{item.title}</h3><p>{item.description}</p></div>
                </div>
              ))}
              {filteredWorks.length === 0 && <p className="no-data">لا توجد أعمال</p>}
            </div>
          </section>
        )}

        {/* Contact */}
        {currentPage === 'contact' && (
          <section className="page active">
            <div className="contact-container">
              <div className="contact-info-row glass-box"><div className="info-card"><i className="fas fa-map-marker-alt"></i> حلب - باب النصر - امام الباب الاثري</div><div className="info-card"><i className="fas fa-phone"></i> 0980428648</div></div>
              <div className="contact-form glass-box"><h3>أرسل لنا استفسارك</h3><input type="text" placeholder="الاسم الكامل" value={contactName} onChange={(e) => setContactName(e.target.value)} /><input type="text" placeholder="رقم الهاتف" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /><textarea placeholder="كيف يمكننا مساعدتك؟" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} /><button className="submit-btn" onClick={submitContact}>إرسال الرسالة</button></div>
            </div>
          </section>
        )}

        {/* About - تصميم فني جديد */}
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
                    <img src={aboutSettings.image_url || "https://customer-assets.emergentagent.com/job_2f9a6599-6bc4-4224-8bce-b59cd468f774/artifacts/1775941528753.png"} alt="Logo" />
                  </div>
                  <h3 className={aboutCardActive ? 'show' : ''}>{aboutSettings.title || 'لمسة فن'}</h3>
                  <p className={aboutCardActive ? 'show' : ''}>{aboutSettings.description || 'نحن متخصصون في تصميم وطباعة جميع أنواع المطبوعات بأعلى جودة وأفضل الأسعار.'}</p>
                  {aboutSettings.button_text && (
                    <button className={`artistic-btn ${aboutCardActive ? 'show' : ''}`} onClick={(e) => { e.stopPropagation(); playClick(); if (aboutSettings.button_link) window.open(aboutSettings.button_link, '_blank'); }}>
                      {aboutSettings.button_text}
                    </button>
                  )}
                </div>
              </div>
              <p className="about-hint">اضغط على البطاقة للمزيد</p>
              
              <div className="about-info-section glass-box">
                <div className="info-item"><i className="fas fa-map-marker-alt"></i> حلب - باب النصر - امام الباب الاثري</div>
                <div className="info-item"><i className="fas fa-phone"></i> 0980428648</div>
              </div>
              
              <h4 className="social-title">تابعنا على</h4>
              <div className="social-links">
                {socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link" title={link.platform} onClick={playClick}><i className={link.icon}></i></a>
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
                <div key={update.id} className="update-card glass-box"><div className="update-version">{update.version}</div><h3 className="update-title">{update.title}</h3><p className="update-desc">{update.description}</p></div>
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
                <button className="logout-btn" onClick={handleLogout}>خروج آمن <i className="fas fa-sign-out-alt"></i></button>
                <div className="admin-tabs">
                  <button className={`tab-link ${adminTab === 'works' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('works'); }}>إدارة الأعمال</button>
                  <button className={`tab-link ${adminTab === 'mytasks' ? 'active' : ''}`} onClick={() => { playClick(); setAdminTab('mytasks'); }}>إدارة أعمالي</button>
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

                {/* My Tasks Tab - إدارة أعمالي */}
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
                            <p>{task.description}</p>
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
                          <div className="update-info"><span className="update-version">{update.version}</span><h4>{update.title}</h4><p>{update.description}</p></div>
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
                        <option value="">اختر الصفحة الهدف</option><option value="home">الرئيسية</option><option value="gallery">المعرض</option><option value="contact">تواصل معنا</option><option value="about">معلومات عننا</option><option value="updates">التحديثات</option>
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
                      <input type="text" placeholder="العنوان" value={aboutSettings.title} onChange={(e) => setAboutSettings({...aboutSettings, title: e.target.value})} />
                      <textarea placeholder="الوصف" value={aboutSettings.description} onChange={(e) => setAboutSettings({...aboutSettings, description: e.target.value})} />
                      <input type="text" placeholder="نص الزر" value={aboutSettings.button_text} onChange={(e) => setAboutSettings({...aboutSettings, button_text: e.target.value})} />
                      <input type="text" placeholder="رابط الزر (URL)" value={aboutSettings.button_link} onChange={(e) => setAboutSettings({...aboutSettings, button_link: e.target.value})} />
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
        <div className="modal-overlay"><div className="glass-box modal-content"><h3>تعديل الإعلان</h3><input type="text" placeholder="عنوان الإعلان" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})} /><textarea placeholder="وصف الإعلان" value={editingAnnouncement.description} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, description: e.target.value})} /><input type="text" placeholder="نص الزر" value={editingAnnouncement.button_text} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_text: e.target.value})} /><select value={editingAnnouncement.button_link} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, button_link: e.target.value})} className="category-select full-width"><option value="">اختر الصفحة</option><option value="home">الرئيسية</option><option value="gallery">المعرض</option><option value="contact">تواصل معنا</option><option value="about">معلومات عننا</option><option value="updates">التحديثات</option></select><div className="modal-actions"><button className="submit-btn" onClick={updateAnnouncement}>حفظ التعديلات</button><button className="cancel-btn" onClick={() => { playClick(); setEditingAnnouncement(null); }}>إلغاء</button></div></div></div>
      )}

      <a href="https://wa.me/963980428648" className="whatsapp-float" target="_blank" rel="noopener noreferrer" onClick={playClick}><i className="fab fa-whatsapp"></i></a>
    </div>
  );
}

export default App;

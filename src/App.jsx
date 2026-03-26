import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Baby, 
  Image as ImageIcon, 
  MessageCircle, 
  Calendar as CalendarIcon,
  Play,
  Square,
  Utensils,
  Moon,
  Pill,
  Droplets,
  Camera,
  LayoutDashboard,
  LogOut,
  Bell,
  X,
  User,
  Settings,
  Users,
  Copy,
  CheckCircle2,
  Key,
  ShieldAlert,
  TrendingUp,
  CreditCard,
  Ban,
  Send,
  Clock,
  Trash2
} from 'lucide-react';

// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE 
// ==========================================
const SUPABASE_URL = 'https://aikpnelyrqffgzflgnhh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BaR6cEkpacl_9FzYB3piag_KMk55hAh';

// Inicialización dinámica de Supabase
let supabase = null;

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hourlyRate] = useState(15.00); 
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFamilyCode, setActiveFamilyCode] = useState('SMI-8X2P'); // Código por defecto

  // Estados de Login
  const [showNannyJoin, setShowNannyJoin] = useState(false);
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Estados de Datos Reales (Supabase)
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Estado para visor de fotos
  
  // Estados para la Agenda (Locales por ahora)
  const [agendaEvents, setAgendaEvents] = useState([
    { id: 1, title: 'Cita con el pediatra', date: '2026-04-15', time: '10:00' },
    { id: 2, title: 'Clase de natación', date: '2026-04-18', time: '16:00' }
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  // Estados Locales de la UI
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [shiftStart, setShiftStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // MOCK DATA PARA EL SÚPER ADMIN (Usado para validar códigos)
  const [adminFamilies, setAdminFamilies] = useState([
    { id: 'FAM-001', name: 'Familia Smith', code: 'SMI-8X2P', status: 'active', plan: 'Premium ($9.99/mo)', joined: 'Hace 2 días' },
    { id: 'FAM-002', name: 'Familia Rodriguez', code: 'ROD-9A4C', status: 'active', plan: 'Básico ($4.99/mo)', joined: 'Hace 5 días' },
  ]);
  const [adminMetrics] = useState({ totalFamilies: 142, activeNannies: 138, mrr: 1418.50 });

  // ==========================================
  // INICIALIZACIÓN DINÁMICA DE SUPABASE
  // ==========================================
  useEffect(() => {
    if (window.supabase) {
      if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsSupabaseReady(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsSupabaseReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // ==========================================
  // RECUPERAR SESIÓN AL RECARGAR PÁGINA
  // ==========================================
  useEffect(() => {
    const session = localStorage.getItem('nanny_app_session');
    if (session) {
      try {
        const { role, code } = JSON.parse(session);
        if (role && code) {
          setUserRole(role);
          setActiveFamilyCode(code);
          setActiveTab('dashboard');
        }
      } catch (e) {
        console.error("Error recuperando sesión", e);
      }
    }
  }, []);

  // ==========================================
  // EFECTOS PARA SUPABASE (TIEMPO REAL Y CARGA)
  // ==========================================
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !userRole || userRole === 'superadmin') return;

    // A) Cargar datos iniciales desde Supabase
    const fetchData = async () => {
      try {
        // Cargar Mensajes
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('family_code', activeFamilyCode)
          .order('timestamp', { ascending: false })
          .limit(50);
        
        if (msgError) console.error("Error cargando mensajes:", msgError);
        // SOLUCIÓN: Usamos [...msgData] para hacer una copia segura antes de voltearlos y evitar que la app colapse al recargar
        if (msgData) setMessages([...msgData].reverse());

        // Cargar Fotos
        const { data: photoData } = await supabase
          .from('photos')
          .select('*')
          .eq('family_code', activeFamilyCode)
          .order('timestamp', { ascending: false })
          .limit(50);
        if (photoData) setPhotos(photoData);

        // Cargar Actividades
        const { data: actData } = await supabase
          .from('activities')
          .select('*')
          .eq('family_code', activeFamilyCode)
          .order('timestamp', { ascending: false })
          .limit(50);
        
        if (actData) {
          setActivities(actData);
          // Analizar las actividades para saber si la niñera está en turno actualmente
          const latestShift = actData.find(a => a.type === 'shift_start' || a.type === 'shift_end');
          if (latestShift && latestShift.type === 'shift_start') {
            setIsClockedIn(true);
            setShiftStart(new Date(latestShift.timestamp));
            setElapsedTime(Math.floor((Date.now() - latestShift.timestamp) / 1000));
          } else {
            setIsClockedIn(false);
            setShiftStart(null);
            setElapsedTime(0);
          }
        }
      } catch (err) {
        console.error("Error general de carga:", err);
      }
    };

    fetchData();

    // B) Suscribirse a cambios en tiempo real
    const channel = supabase.channel(`family_room_${activeFamilyCode}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `family_code=eq.${activeFamilyCode}` }, payload => {
        setMessages(current => [...current, payload.new]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: `family_code=eq.${activeFamilyCode}` }, payload => {
        setPhotos(current => [payload.new, ...current]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos' }, payload => {
        // Escuchar cuando una foto es eliminada
        setPhotos(current => current.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `family_code=eq.${activeFamilyCode}` }, payload => {
        setActivities(current => [payload.new, ...current]);
        
        // Disparar notificación push visual
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setNotifications(prev => [{ id: Date.now(), text: `Nueva actividad: ${payload.new.title}`, time: timeNow, unread: true }, ...prev]);
        
        // Sincronizar el turno en tiempo real
        if (payload.new.type === 'shift_start') {
          setIsClockedIn(true);
          setShiftStart(new Date(payload.new.timestamp));
          setElapsedTime(0);
        } else if (payload.new.type === 'shift_end') {
          setIsClockedIn(false);
          setShiftStart(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userRole, activeFamilyCode, isSupabaseReady]);

  // Autoscroll del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cronómetro sincronizado
  useEffect(() => {
    let interval;
    if (isClockedIn && shiftStart) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - shiftStart.getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, shiftStart]);


  // ==========================================
  // FUNCIONES QUE GUARDAN EN BASE DE DATOS
  // ==========================================

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isSupabaseReady || !supabase) return;
    
    const msg = {
      sender: userRole, 
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      family_code: activeFamilyCode
    };
    
    setNewMessage(''); 
    const { error } = await supabase.from('messages').insert([msg]);
    if (error) console.error("Error enviando mensaje:", error);
  };

  const addActivity = async (type, title) => {
    if (!isSupabaseReady || !supabase) return;
    const notes = window.prompt(`Añadir notas para ${title}:`, "") || "Sin notas adicionales";
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAct = { 
      type, 
      title, 
      time: timeNow, 
      notes: notes, 
      timestamp: Date.now(),
      family_code: activeFamilyCode 
    };

    const { error } = await supabase.from('activities').insert([newAct]);
    
    if (error) {
      console.error("Error guardando actividad:", error);
      alert("Hubo un error al guardar la actividad");
    } else {
      setToastMessage(`Registrado: "${title}". Se notificó al instante.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !isSupabaseReady || !supabase) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(`public/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(`public/${fileName}`);

      await supabase.from('photos').insert([{
        url: publicUrl,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        family_code: activeFamilyCode
      }]);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert(`Hubo un error subiendo la foto: ${error.message}\n\n⚠️ Si el error menciona "Row Level Security", debes ir a Supabase -> Storage -> Policies y crear una política que permita la acción "INSERT" para el bucket 'gallery'.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Función para que la Familia elimine fotos
  const deletePhoto = async (photo) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta foto de la galería?")) return;
    if (!isSupabaseReady || !supabase) return;

    try {
      // 1. Extraer el nombre del archivo de la URL pública
      const urlParts = photo.url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // 2. Eliminar del Storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([`public/${fileName}`]);
      
      if (storageError) console.error("Error eliminando del storage:", storageError);

      // 3. Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      setToastMessage("Foto eliminada correctamente.");
      setTimeout(() => setToastMessage(null), 3000);
      
      // Si la foto eliminada es la que está en pantalla completa, ciérrala
      if (selectedPhoto && selectedPhoto.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error("Error eliminando la foto:", error);
      alert(`No se pudo eliminar la foto: ${error.message}`);
    }
  };

  const handleClockInOut = async () => {
    if (!isSupabaseReady || !supabase) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentTimestamp = Date.now();

    if (isClockedIn) {
      // Registrar Fin de Turno en Supabase
      const newAct = {
        type: 'shift_end',
        title: 'Fin de Turno',
        time: timeNow,
        notes: `Turno finalizado. Duración: ${formatTime(elapsedTime)} hrs.`,
        timestamp: currentTimestamp,
        family_code: activeFamilyCode
      };
      await supabase.from('activities').insert([newAct]);
    } else {
      // Registrar Inicio de Turno en Supabase
      const newAct = {
        type: 'shift_start',
        title: 'Inicio de Turno',
        time: timeNow,
        notes: 'La niñera ha comenzado su turno.',
        timestamp: currentTimestamp,
        family_code: activeFamilyCode
      };
      await supabase.from('activities').insert([newAct]);
    }
  };

  const addAgendaEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;
    
    const newEvent = {
      id: Date.now(),
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime
    };
    
    setAgendaEvents([...agendaEvents, newEvent]);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setToastMessage(`Evento guardado en la agenda.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const removeAgendaEvent = (id) => {
    setAgendaEvents(agendaEvents.filter(event => event.id !== id));
  };

  // ==========================================
  // FUNCIONES DE LOGIN Y NAVEGACIÓN
  // ==========================================

  const handleParentLogin = () => {
    setUserRole('parent');
    setActiveFamilyCode('SMI-8X2P'); 
    setActiveTab('dashboard');
    // Guardar sesión
    localStorage.setItem('nanny_app_session', JSON.stringify({ role: 'parent', code: 'SMI-8X2P' }));
  };

  const handleNannyJoin = (e) => {
    e.preventDefault();
    const cleanCode = familyCodeInput.trim().toUpperCase();
    
    // Obtener la lista de códigos válidos simulados en el sistema
    const validCodes = adminFamilies.map(f => f.code);
    
    if (cleanCode.length < 5) {
      setLoginError('Por favor ingresa un código válido (ej. SMI-8X2P)');
      return;
    }

    // VALIDACIÓN: Comprobar si el código existe en la plataforma
    if (!validCodes.includes(cleanCode)) {
      setLoginError('El código ingresado no existe o la familia no está registrada. Verifica con los padres.');
      return;
    }
    
    setLoginError('');
    setUserRole('nanny');
    setActiveFamilyCode(cleanCode);
    setActiveTab('dashboard');
    // Guardar sesión limpia
    localStorage.setItem('nanny_app_session', JSON.stringify({ role: 'nanny', code: cleanCode }));
  };

  const handleLogout = () => {
    setUserRole(null);
    setShowNannyJoin(false);
    setShowAdminLogin(false);
    setFamilyCodeInput('');
    setLoginError('');
    setAdminPassword('');
    // Borrar sesión y resetear estados
    localStorage.removeItem('nanny_app_session');
    setIsClockedIn(false);
    setShiftStart(null);
    setElapsedTime(0);
  };

  const handleSuperAdminAuth = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { 
      setUserRole('superadmin');
      setActiveTab('admin_dashboard');
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminLoginError('');
    } else {
      setAdminLoginError('Contraseña incorrecta. (Pista: admin123)');
    }
  };

  const toggleFamilyStatus = (id) => {
    setAdminFamilies(adminFamilies.map(fam => 
      fam.id === id ? { ...fam, status: fam.status === 'active' ? 'suspended' : 'active' } : fam
    ));
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'food': return <Utensils className="text-orange-500" />;
      case 'diaper': return <Droplets className="text-blue-500" />;
      case 'sleep': return <Moon className="text-indigo-500" />;
      case 'meds': return <Pill className="text-red-500" />;
      case 'shift_start': return <Play className="text-green-500" />;
      case 'shift_end': return <Square className="text-red-500" />;
      default: return <Baby className="text-gray-500" />;
    }
  };

  // ==========================================
  // VISTAS
  // ==========================================

  const renderSuperAdminDashboard = () => (
    <div className="bg-gray-50 p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Vista Global de Plataforma</h2>
            <p className="text-gray-500 mt-1">Gestión general de usuarios y suscripciones.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Familias Activas</p>
              <h3 className="text-4xl font-black text-gray-900">{adminMetrics.totalFamilies}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Niñeras Conectadas</p>
              <h3 className="text-4xl font-black text-gray-900">{adminMetrics.activeNannies}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Baby size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos (MRR)</p>
              <h3 className="text-4xl font-black text-green-600">${adminMetrics.mrr.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Familias Registradas Recientemente</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Familia</th>
                  <th className="px-6 py-4 font-bold">Código de Unión</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminFamilies.map((family) => (
                  <tr key={family.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{family.name}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{family.code}</td>
                    <td className="px-6 py-4">
                      {family.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          <Ban size={10} /> Suspendido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleFamilyStatus(family.id)}
                        className={`text-sm font-medium px-4 py-2 rounded-lg transition border ${family.status === 'active' ? 'text-red-600 bg-white border-red-200 hover:bg-red-50' : 'text-green-600 bg-white border-green-200 hover:bg-green-50'}`}
                      >
                        {family.status === 'active' ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFamilyProfile = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 h-full flex flex-col overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
            FS
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tu Familia</h2>
            <p className="text-gray-500">Plan Premium Activo</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-indigo-600" /> Mi Equipo de Cuidado
        </h3>
        
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <h4 className="font-bold text-indigo-900 mb-2">Invita a tu niñera a unirse</h4>
          <p className="text-sm text-indigo-700/80 mb-6">
            Comparte este código de acceso único con tu niñera para vincular sus cuentas en la base de datos real.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white border-2 border-dashed border-indigo-200 rounded-xl p-4 flex justify-center items-center relative">
              <span className="text-2xl font-mono font-bold tracking-[0.2em] text-indigo-600">
                {activeFamilyCode}
              </span>
            </div>
            <button 
              onClick={() => {
                setCopiedCode(true);
                navigator.clipboard.writeText(activeFamilyCode);
                setTimeout(() => setCopiedCode(false), 3000);
              }}
              className="px-6 py-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition font-medium shadow-sm shrink-0"
            >
              {copiedCode ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copiedCode ? '¡Código Copiado!' : 'Copiar Código'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const currentEarned = (elapsedTime / 3600) * hourlyRate;
    
    return (
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 h-full p-4 md:p-6">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col min-h-[450px]">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 border-b border-gray-100 pb-4 gap-4">
             <h2 className="text-lg md:text-xl font-bold text-gray-800">Registro de Actividades</h2>
             
             {userRole === 'nanny' && (
               <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-start sm:justify-end gap-2 w-full sm:w-auto">
                  <button onClick={() => addActivity('food', 'Comida')} className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition text-xs md:text-sm font-medium"><Utensils size={14} className="shrink-0" /> <span className="truncate">Comida</span></button>
                  <button onClick={() => addActivity('diaper', 'Pañal')} className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-xs md:text-sm font-medium"><Droplets size={14} className="shrink-0" /> <span className="truncate">Pañal</span></button>
                  <button onClick={() => addActivity('sleep', 'Siesta')} className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-xs md:text-sm font-medium"><Moon size={14} className="shrink-0" /> <span className="truncate">Siesta</span></button>
                  <button onClick={() => addActivity('meds', 'Medicina')} className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-xs md:text-sm font-medium"><Pill size={14} className="shrink-0" /> <span className="truncate">Medicina</span></button>
               </div>
             )}
           </div>
           
           <div className="flex-1 overflow-y-auto pr-1 md:pr-2">
              <div className="space-y-3 md:space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-sm shrink-0 border border-gray-100">
                      {getActivityIcon(act.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-row justify-between items-start mb-1 gap-2">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">{act.title}</h3>
                        <span className="text-xs md:text-sm font-semibold text-gray-500 bg-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 break-words">{act.notes}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-center text-gray-400 py-10">Aún no hay registros en la base de datos.</p>}
              </div>
           </div>
        </div>

        <div className="w-full xl:w-96 flex flex-col gap-4 md:gap-6 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 border-b border-gray-100 pb-3 md:pb-4">Control de Turnos</h2>
            
            <div className="text-center mb-4 md:mb-6">
              <div className="text-4xl md:text-5xl font-mono font-light text-gray-800 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                {isClockedIn ? `Iniciado a las ${shiftStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No hay turno activo'}
              </p>
            </div>

            {userRole === 'nanny' ? (
              <button 
                onClick={handleClockInOut}
                className={`flex items-center justify-center gap-2 w-full py-3 md:py-4 rounded-xl text-base md:text-lg font-bold text-white transition-all shadow-sm ${
                  isClockedIn 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isClockedIn ? <Square size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
                {isClockedIn ? 'Finalizar Turno' : 'Iniciar Turno'}
              </button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 font-medium">
                  {isClockedIn ? 'La niñera está trabajando ahora 🟢' : 'La niñera no está en turno ⚪'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
              <div className="bg-blue-50 rounded-xl p-3 md:p-4 border border-blue-100 min-w-0">
                <p className="text-xs md:text-sm text-blue-700 font-medium mb-1 truncate">Ganancia Actual</p>
                <p className="text-lg md:text-xl font-bold text-blue-900 truncate">${currentEarned.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 md:p-4 border border-emerald-100 min-w-0">
                <p className="text-xs md:text-sm text-emerald-700 font-medium mb-1 truncate">Tarifa/Hora</p>
                <p className="text-lg md:text-xl font-bold text-emerald-900 truncate">${hourlyRate.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPhotos = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 h-full flex flex-col m-4 md:m-6">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Galería Familiar</h2>
          <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Las fotos se guardan en el Storage de Supabase.</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          className="hidden" 
        />
        {userRole === 'nanny' && (
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs md:text-sm font-medium shadow-sm shrink-0 disabled:bg-blue-400"
          >
            {isUploading ? "Subiendo..." : <><Camera size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Subir Foto</span><span className="sm:hidden">Subir</span></>}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 overflow-y-auto flex-1 pr-1 md:pr-2 pb-4">
        {photos.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">No hay fotos en la galería.</p>}
        {photos.map(photo => (
          <div 
            key={photo.id} 
            className="rounded-xl overflow-hidden shadow-sm aspect-square relative group cursor-pointer border border-gray-200"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img src={photo.url} alt="Momento capturado" className="object-cover w-full h-full group-hover:scale-105 transition duration-500" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-90">
              <p className="text-white text-sm font-medium">{photo.time}</p>
            </div>

            {/* Botón de eliminar (Solo para Familia) */}
            {userRole === 'parent' && (
              <button 
                onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md backdrop-blur-sm"
                title="Eliminar foto"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMiniCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    // Espacios vacíos antes del primer día del mes
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      // Formatear fecha para comparar con YYYY-MM-DD
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasEvent = agendaEvents.some(e => e.date === dateString);
      
      days.push(
        <div 
          key={i} 
          onClick={() => setNewEventDate(dateString)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm relative transition-colors cursor-pointer ${
            hasEvent ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
          } ${newEventDate === dateString ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
        >
          {i}
          {hasEvent && <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>}
        </div>
      );
    }

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 w-full h-full">
        <h3 className="font-bold text-gray-800 text-center mb-4 capitalize">{monthNames[currentMonth]} {currentYear}</h3>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
            <div key={d} className="text-xs font-bold text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {days}
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden m-4 md:m-6">
      <div className="bg-white p-4 md:p-6 border-b border-gray-100 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md shrink-0">
            {userRole === 'nanny' ? 'F' : 'N'}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-800 text-base md:text-xl truncate">
              {userRole === 'nanny' ? `Familia (${activeFamilyCode})` : 'Niñera Activa'}
            </h2>
            <p className="text-xs md:text-sm text-green-600 flex items-center gap-1.5 font-medium mt-0.5 md:mt-1">
              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span> Chat en tiempo real conectado
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === userRole ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[50%] p-3 md:p-4 rounded-2xl shadow-sm ${
                msg.sender === userRole 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
              }`}
            >
              <p className="text-sm md:text-[15px] leading-relaxed break-words">{msg.text}</p>
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2 mx-1 font-medium">{msg.time}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-gray-400 py-10">Envía el primer mensaje...</p>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 max-w-5xl mx-auto">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..." 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 md:px-6 md:py-4 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-[15px]"
          />
          <button 
            type="submit"
            className="px-4 py-3 md:px-8 md:py-4 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-medium shadow-sm shrink-0"
          >
            <span className="hidden sm:inline">Enviar</span>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 h-full flex flex-col m-4 md:m-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 gap-4 shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Agenda Semanal</h2>
          <p className="text-xs md:text-sm text-gray-500">Planifica eventos y recordatorios importantes.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        
        {/* Columna Izquierda: Formulario */}
        <div className="w-full lg:w-1/4 shrink-0">
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-4">Nuevo Evento</h3>
            <form onSubmit={addAgendaEvent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Título</label>
                <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Ej: Vacuna del bebé" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Fecha</label>
                <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Hora</label>
                <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-sm flex justify-center items-center gap-2">
                <CalendarIcon size={16} /> Guardar evento
              </button>
            </form>
          </div>
        </div>

        {/* Columna Central: Mini Calendario Visual */}
        <div className="w-full lg:w-1/3 shrink-0 hidden sm:block">
          {renderMiniCalendar()}
        </div>

        {/* Columna Derecha: Lista de eventos */}
        <div className="flex-1 overflow-y-auto pr-2 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
          <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-600" /> Próximos Eventos
          </h3>
          {agendaEvents.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No hay eventos programados en la agenda.</p>
          ) : (
            <div className="space-y-3">
              {agendaEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => (
                <div key={event.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition bg-white group shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <CalendarIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1 font-medium"><CalendarIcon size={12} /> {event.date}</span>
                      {event.time && <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeAgendaEvent(event.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- PANTALLAS DE LOGIN ---
  if (!userRole) {
    if (showAdminLogin) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-white shadow-lg transform mx-auto mb-6 mt-4">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Acceso <span className="text-red-500">Restringido</span>
            </h1>
            <p className="text-gray-400 mb-8 font-medium">Panel Maestro de la Plataforma</p>

            <form onSubmit={handleSuperAdminAuth} className="space-y-4">
              <input 
                type="password" 
                placeholder="Contraseña Maestra"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full text-center text-xl tracking-[0.2em] px-4 py-4 bg-gray-900 border border-gray-600 text-white rounded-xl outline-none focus:border-red-500 transition-all mb-2 placeholder-gray-600"
              />
              {adminLoginError && <p className="text-red-400 text-sm font-medium">{adminLoginError}</p>}
              
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowAdminLogin(false); setAdminLoginError(''); setAdminPassword(''); }} className="flex-1 px-4 py-3 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-xl transition font-medium">
                  Volver
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl transition font-medium shadow-sm">
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50 -z-10"></div>
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-6 mx-auto mb-6 mt-4">
            <Baby size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
            Daily<span className="text-blue-600">Nanny</span>
          </h1>

          {!showNannyJoin ? (
            <>
              <p className="text-gray-500 mb-8 font-medium">Selecciona tu perfil para entrar</p>
              <div className="space-y-4">
                <button onClick={() => setShowNannyJoin(true)} className="w-full flex items-center p-4 bg-white hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-200 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition text-blue-600">
                    <User size={24} />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-900 text-lg">Entrar como Niñera</p>
                    <p className="text-sm text-gray-500">Registrar el día y fichar turnos</p>
                  </div>
                </button>

                <button onClick={handleParentLogin} className="w-full flex items-center p-4 bg-white hover:bg-indigo-50 border-2 border-gray-100 hover:border-indigo-200 rounded-2xl transition-all group shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition text-indigo-600">
                    <Baby size={24} />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-900 text-lg">Entrar como Familia</p>
                    <p className="text-sm text-gray-500">Ver reportes y gestionar pagos</p>
                  </div>
                </button>
              </div>
              
              <div className="mt-10 pt-6 border-t border-gray-100">
                <button onClick={() => setShowAdminLogin(true)} className="text-xs text-gray-300 font-medium hover:text-gray-600 transition flex items-center justify-center gap-1.5 mx-auto outline-none">
                  <div className="p-1 bg-gray-50 rounded-full border border-gray-100"><Key size={10} className="text-gray-400" /></div> Administrador de Plataforma
                </button>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100">
                <Key size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ingresa tu código</h3>
              <p className="text-sm text-gray-500 mb-6 px-4">
                Pídele a la familia el código de vinculación para poder acceder a su perfil.
              </p>
              
              <form onSubmit={handleNannyJoin}>
                <input 
                  type="text" 
                  placeholder="Ej: SMI-8X2P"
                  value={familyCodeInput}
                  onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                  className="w-full text-center text-2xl tracking-[0.2em] font-mono font-bold px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all mb-2 uppercase"
                />
                {loginError && <p className="text-red-500 text-sm font-medium mb-4">{loginError}</p>}
                
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => { setShowNannyJoin(false); setLoginError(''); setFamilyCodeInput(''); }} className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium">Volver</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition font-medium shadow-sm">Vincular</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER PRINCIPAL ---
  return (
    <div className="flex h-[100dvh] bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0 z-10 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md transform -rotate-6">
            <Baby size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Daily<span className="text-blue-600">Nanny</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {userRole !== 'superadmin' ? (
            <>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3 mt-4">Navegación Principal</p>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'} /> Panel de Control
              </button>
              <button onClick={() => setActiveTab('photos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'photos' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <ImageIcon size={20} className={activeTab === 'photos' ? 'text-blue-600' : 'text-gray-400'} /> Galería Familiar
              </button>
              <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <div className="flex items-center gap-3"><MessageCircle size={20} className={activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400'} /> Mensajes</div>
              </button>
              <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'calendar' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <CalendarIcon size={20} className={activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-400'} /> Agenda y Eventos
              </button>

              {userRole === 'parent' && (
                <>
                  <div className="my-4 border-t border-gray-100"></div>
                  <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Settings size={20} className={activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'} /> Ajustes de Familia
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3 mt-4">Panel Global</p>
              <button onClick={() => setActiveTab('admin_dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium ${activeTab === 'admin_dashboard' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <TrendingUp size={20} className={activeTab === 'admin_dashboard' ? 'text-white' : 'text-gray-400'} /> Vista General
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2 p-2 rounded-xl border border-transparent">
            {userRole !== 'superadmin' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
                  <img src={userRole === 'nanny' ? "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" : "https://images.unsplash.com/photo-1544252890-a5482bf47e09?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{userRole === 'nanny' ? 'Sarah Connor' : 'Familia Activa'}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{activeFamilyCode}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-white shadow-sm flex items-center justify-center text-white shrink-0"><ShieldAlert size={20} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">Administrador</p>
                  <p className="text-xs text-gray-500 truncate">Dueño de Plataforma</p>
                </div>
              </>
            )}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition text-sm font-medium border border-gray-200 hover:border-red-100 bg-white shadow-sm">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative w-full">
        <header className="h-16 md:h-20 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
           <div className="min-w-0 pr-4">
             <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
               {activeTab === 'dashboard' ? 'Panel de Control' : 
                activeTab === 'photos' ? 'Galería' :
                activeTab === 'chat' ? 'Centro de Mensajes' : 
                activeTab === 'profile' ? 'Mi Perfil' : 
                activeTab === 'admin_dashboard' ? 'Administración Global' : 'Agenda Semanal'}
             </h2>
             <p className="text-xs md:text-sm text-gray-500 hidden md:block">
               {userRole === 'superadmin' ? 'Métricas y cuentas de clientes.' : `Conectado al entorno: ${activeFamilyCode}`}
             </p>
           </div>
           
           <div className="flex items-center gap-2 md:gap-6 shrink-0">
             {userRole === 'parent' && (
               <button onClick={() => setActiveTab('profile')} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-full relative transition">
                 <Settings size={20} className="md:w-[22px] md:h-[22px]" />
               </button>
             )}

             <div className="relative">
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-full relative transition">
                 <Bell size={20} className="md:w-[22px] md:h-[22px]" />
                 {notifications.filter(n => n.unread).length > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                 )}
               </button>

               {showNotifications && (
                 <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                   <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <h3 className="font-bold text-gray-800">Notificaciones</h3>
                     <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                   </div>
                   <div className="max-h-80 overflow-y-auto p-2">
                     {notifications.length === 0 ? (
                       <p className="p-4 text-center text-sm text-gray-500">No hay notificaciones.</p>
                     ) : (
                       notifications.map(n => (
                         <div key={n.id} className={`p-3 rounded-xl transition border-b border-gray-50 last:border-0 ${n.unread ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                           <p className="text-sm text-gray-800 font-medium">{n.text}</p>
                           <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'photos' && renderPhotos()}
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'profile' && renderFamilyProfile()}
          {activeTab === 'admin_dashboard' && renderSuperAdminDashboard()}
        </div>

        {/* Modal de Visor de Fotos en Pantalla Completa */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm cursor-pointer" 
            onClick={() => setSelectedPhoto(null)}
          >
            <button 
              className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-400 hover:text-white p-2 transition bg-black/50 rounded-full" 
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={32} />
            </button>
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img 
                src={selectedPhoto.url} 
                alt="Foto en pantalla completa" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic en la foto
              />
              <div className="absolute -bottom-10 left-0 right-0 text-center">
                <p className="font-medium text-white text-lg bg-black/50 inline-block px-4 py-1 rounded-full">{selectedPhoto.time}</p>
              </div>
            </div>
          </div>
        )}

        {userRole !== 'superadmin' && (
          <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around items-center px-2 py-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center w-16 p-1 transition ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} className="mb-1" />
            </button>
            <button onClick={() => setActiveTab('photos')} className={`flex flex-col items-center justify-center w-16 p-1 transition ${activeTab === 'photos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <ImageIcon size={22} strokeWidth={activeTab === 'photos' ? 2.5 : 2} className="mb-1" />
            </button>
            <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center justify-center w-16 p-1 relative transition ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <MessageCircle size={22} strokeWidth={activeTab === 'chat' ? 2.5 : 2} className="mb-1" />
            </button>
            <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center justify-center w-16 p-1 transition ${activeTab === 'calendar' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <CalendarIcon size={22} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} className="mb-1" />
            </button>
          </nav>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 bg-gray-900 text-white px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-2xl flex items-center gap-3 md:gap-4 z-50 animate-bounce max-w-[90vw] md:max-w-md">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
            <Bell size={16} className="text-blue-400 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs md:text-sm text-blue-400 mb-0.5 truncate">Notificación Push</p>
            <p className="text-xs md:text-sm text-gray-200 truncate">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
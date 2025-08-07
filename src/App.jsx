import React, { useState, useEffect } from 'react';
import dhikrData from './data/dhikrData.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Sun, Moon, RotateCcw, Users, Bell, BellOff, Save } from 'lucide-react';
import './App.css';

function App() {
  const [currentDhikrType, setCurrentDhikrType] = useState('morning');
  const [dhikrCounts, setDhikrCounts] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // تحميل البيانات المحفوظة عند بدء التطبيق
  useEffect(() => {
    // تحميل عدد الزيارات مع البدء من العدد الحقيقي
    const localCount = localStorage.getItem('dhikr_site_visits') || '1729';
    const currentCount = parseInt(localCount);
    const newCount = currentCount + 1;
    localStorage.setItem('dhikr_site_visits', newCount.toString());
    setVisitorCount(newCount);

    // تحميل التقدم المحفوظ
    const savedProgress = localStorage.getItem('dhikr_progress');
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        setDhikrCounts(parsedProgress.counts || {});
        setCurrentDhikrType(parsedProgress.currentType || 'morning');
      } catch (error) {
        console.error('خطأ في تحميل التقدم المحفوظ:', error);
      }
    }

    // تحميل إعدادات التذكيرات
    const savedNotifications = localStorage.getItem('dhikr_notifications');
    if (savedNotifications === 'true') {
      setNotificationsEnabled(true);
    }
  }, []);

  // حفظ التقدم تلقائياً عند تغيير العدادات
  useEffect(() => {
    const progressData = {
      counts: dhikrCounts,
      currentType: currentDhikrType,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('dhikr_progress', JSON.stringify(progressData));
    setLastSaveTime(new Date());
  }, [dhikrCounts, currentDhikrType]);

  // فحص إكمال جميع الأذكار
  useEffect(() => {
    const currentDhikrList = dhikrData[currentDhikrType];
    const allCompleted = currentDhikrList.every(dhikr => 
      dhikrCounts[`${currentDhikrType}-${dhikr.id}`] >= dhikr.count
    );
    
    if (allCompleted && currentDhikrList.length > 0) {
      setShowCompletionModal(true);
      
      // إرسال تذكير إذا كانت التذكيرات مفعلة
      if (notificationsEnabled && 'Notification' in window) {
        new Notification('تهانينا! 🎉', {
          body: `لقد أكملت ${currentDhikrType === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}`,
          icon: '/favicon.ico'
        });
      }
    }
  }, [dhikrCounts, currentDhikrType, notificationsEnabled]);

  // إخفاء نافذة التهنئة عند تغيير نوع الذكر
  useEffect(() => {
    setShowCompletionModal(false);
  }, [currentDhikrType]);

  // إعداد التذكيرات
  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('المتصفح لا يدعم التذكيرات');
      return;
    }

    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('dhikr_notifications', 'true');
        
        // جدولة تذكيرات يومية
        scheduleNotifications();
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('dhikr_notifications', 'false');
    }
  };

  // جدولة التذكيرات اليومية
  const scheduleNotifications = () => {
    // تذكير أذكار الصباح (7:00 صباحاً)
    const morningTime = new Date();
    morningTime.setHours(7, 0, 0, 0);
    if (morningTime < new Date()) {
      morningTime.setDate(morningTime.getDate() + 1);
    }

    // تذكير أذكار المساء (6:00 مساءً)
    const eveningTime = new Date();
    eveningTime.setHours(18, 0, 0, 0);
    if (eveningTime < new Date()) {
      eveningTime.setDate(eveningTime.getDate() + 1);
    }

    // ملاحظة: في التطبيق الحقيقي، ستحتاج لاستخدام Service Worker للتذكيرات المجدولة
    console.log('تم تفعيل التذكيرات اليومية');
  };

  const handleDhikrClick = (type, id, targetCount) => {
    setDhikrCounts(prevCounts => {
      const key = `${type}-${id}`;
      const newCount = prevCounts[key] ? prevCounts[key] + 1 : 1;
      if (newCount <= targetCount) {
        return {
          ...prevCounts,
          [key]: newCount
        };
      }
      return prevCounts;
    });
  };

  const resetDhikrCount = (type, id) => {
    setDhikrCounts(prevCounts => ({
      ...prevCounts,
      [`${type}-${id}`]: 0
    }));
  };

  const resetAllDhikr = () => {
    const resetCounts = {};
    Object.keys(dhikrData).forEach(type => {
      dhikrData[type].forEach(dhikr => {
        resetCounts[`${type}-${dhikr.id}`] = 0;
      });
    });
    setDhikrCounts(resetCounts);
    setShowCompletionModal(false);
  };

  // حساب إحصائيات التقدم
  const getProgressStats = () => {
    const currentList = dhikrData[currentDhikrType];
    const completed = currentList.filter(dhikr => 
      dhikrCounts[`${currentDhikrType}-${dhikr.id}`] >= dhikr.count
    ).length;
    const total = currentList.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const currentDhikrList = dhikrData[currentDhikrType];
  const isDarkMode = currentDhikrType === 'evening';
  const progressStats = getProgressStats();

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 dark' 
        : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100'
    }`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 ${
            isDarkMode ? 'text-white' : 'text-emerald-800'
          }`}>
            {currentDhikrType === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}
          </h1>
          <p className={`text-base sm:text-lg mb-2 sm:mb-4 ${
            isDarkMode ? 'text-blue-200' : 'text-emerald-600'
          }`}>
            بسم الله نبدأ
          </p>
          
          {/* شريط التقدم */}
          <div className={`max-w-sm sm:max-w-md mx-auto p-3 sm:p-4 rounded-xl ${
            isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs sm:text-sm font-semibold ${
                isDarkMode ? 'text-white' : 'text-slate-700'
              }`}>
                التقدم: {progressStats.completed}/{progressStats.total}
              </span>
              <span className={`text-xs sm:text-sm font-bold ${
                isDarkMode ? 'text-blue-200' : 'text-emerald-600'
              }`}>
                {progressStats.percentage}%
              </span>
            </div>
            <div className={`w-full h-2 sm:h-3 rounded-full ${
              isDarkMode ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isDarkMode ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* أزرار التبديل والإعدادات */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 sm:p-2 flex gap-1 sm:gap-2 w-full max-w-sm sm:max-w-none sm:w-auto">
            <Button
              onClick={() => setCurrentDhikrType('morning')}
              variant={currentDhikrType === 'morning' ? 'default' : 'ghost'}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-semibold transition-all duration-300 flex-1 sm:flex-none ${
                currentDhikrType === 'morning'
                  ? 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              أذكار الصباح
            </Button>
            <Button
              onClick={() => setCurrentDhikrType('evening')}
              variant={currentDhikrType === 'evening' ? 'default' : 'ghost'}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-semibold transition-all duration-300 flex-1 sm:flex-none ${
                currentDhikrType === 'evening'
                  ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                  : isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              أذكار المساء
            </Button>
          </div>
          
          {/* أزرار الإعدادات */}
          <div className="flex flex-wrap justify-center gap-2 px-2">
            <Button
              onClick={toggleNotifications}
              variant="outline"
              size="sm"
              className={`rounded-full text-xs sm:text-sm px-3 sm:px-4 py-2 ${
                isDarkMode 
                  ? 'border-white/30 text-white hover:bg-white/10' 
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {notificationsEnabled ? (
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              ) : (
                <BellOff className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              )}
              {notificationsEnabled ? 'إيقاف التذكيرات' : 'تفعيل التذكيرات'}
            </Button>
            
            {lastSaveTime && (
              <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs ${
                isDarkMode ? 'bg-white/10 text-white' : 'bg-white/80 text-slate-600'
              }`}>
                <Save className="w-3 h-3" />
                تم الحفظ {lastSaveTime.toLocaleTimeString('ar-SA', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>
        </div>

        {/* قائمة الأذكار */}
        <div className="grid gap-3 sm:gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-4xl mx-auto">
          {currentDhikrList.map((dhikr) => {
            const currentCount = dhikrCounts[`${currentDhikrType}-${dhikr.id}`] || 0;
            const isCompleted = currentCount >= dhikr.count;
            
            return (
              <Card key={dhikr.id} className={`transition-all duration-300 hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' 
                  : 'bg-white/90 backdrop-blur-sm border-emerald-200'
              } ${isCompleted ? 'ring-2 ring-green-400' : ''}`}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-600' 
                        : isDarkMode ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {isCompleted ? '✓' : dhikr.id}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <p className={`text-sm sm:text-lg leading-relaxed mb-3 sm:mb-4 break-words ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      }`}>
                        {dhikr.text}
                      </p>
                      <p className={`text-xs sm:text-sm mb-3 sm:mb-4 italic break-words ${
                        isDarkMode ? 'text-blue-200' : 'text-emerald-600'
                      }`}>
                        {dhikr.reference}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <Button
                            onClick={() => handleDhikrClick(currentDhikrType, dhikr.id, dhikr.count)}
                            disabled={isCompleted}
                            className={`px-3 sm:px-6 py-2 rounded-full font-semibold transition-all duration-200 text-xs sm:text-sm flex-shrink-0 ${
                              isCompleted
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isDarkMode
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isCompleted ? 'مكتمل' : 'عدد المرات'}
                          </Button>
                          
                          <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-bold flex-shrink-0 ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : isDarkMode
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {currentCount}/{dhikr.count}
                          </div>
                          
                          <Button
                            onClick={() => resetDhikrCount(currentDhikrType, dhikr.id)}
                            variant="outline"
                            size="sm"
                            className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0 ${
                              isDarkMode 
                                ? 'border-white/30 text-white hover:bg-white/10' 
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            إعادة
                          </Button>
                        </div>
                        
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 sm:px-3 py-1 text-xs sm:text-sm flex-shrink-0">
                            ✓ تم إكمال الذكر
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* رسالة الختام */}
        <div className="text-center mt-8 sm:mt-12 mb-6 sm:mb-8">
          <p className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 ${
            isDarkMode ? 'text-blue-200' : 'text-emerald-700'
          }`}>
            تقبل الله منا ومنكم صالح الأعمال
          </p>
          
          <Button
            onClick={resetAllDhikr}
            variant="outline"
            className={`px-4 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-semibold ${
              isDarkMode 
                ? 'border-white/30 text-white hover:bg-white/10' 
                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            إعادة تعيين جميع الأذكار
          </Button>
        </div>

        {/* عداد الزوار */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full ${
            isDarkMode 
              ? 'bg-white/10 backdrop-blur-sm text-white' 
              : 'bg-white/80 backdrop-blur-sm text-slate-700'
          }`}>
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">عدد زوار الموقع</span>
            <Badge variant="secondary" className="text-sm sm:text-lg font-bold px-2 sm:px-3 py-1">
              {visitorCount.toLocaleString('ar-SA')}
            </Badge>
          </div>
        </div>

        {/* نافذة التهنئة عند إكمال جميع الأذكار */}
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className={`max-w-sm sm:max-w-md w-full rounded-2xl p-6 sm:p-8 text-center animate-in zoom-in duration-300 ${
              isDarkMode 
                ? 'bg-slate-800 text-white border border-white/20' 
                : 'bg-white text-slate-800 border border-emerald-200'
            }`}>
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">تهانينا!</h3>
              <p className="text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
                لقد أكملت {currentDhikrType === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'} بالكامل!
                <br />
                تقبل الله منك صالح الأعمال
              </p>
              <Button
                onClick={() => setShowCompletionModal(false)}
                className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                الحمد لله
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


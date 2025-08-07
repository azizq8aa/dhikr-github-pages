import React, { useState, useEffect } from 'react';
import dhikrData from './data/dhikrData';
import './App.css';

function App() {
  const [currentDhikrType, setCurrentDhikrType] = useState('morning'); // 'morning' or 'evening'
  const [visitorCount, setVisitorCount] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [dhikrCounts, setDhikrCounts] = useState(() => {
    const initialCounts = {};
    Object.keys(dhikrData).forEach(type => {
      dhikrData[type].forEach(dhikr => {
        initialCounts[`${type}-${dhikr.id}`] = 0;
      });
    });
    return initialCounts;
  });

  useEffect(() => {
    if (currentDhikrType === 'evening') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [currentDhikrType]);

  // جلب عدد الزوار عند تحميل الصفحة
  useEffect(() => {
    const updateVisitorCount = () => {
      // الحصول على عدد الزيارات المحلي
      const localCount = localStorage.getItem('dhikr_site_visits') || '0';
      const currentCount = parseInt(localCount);
      
      // زيادة العدد
      const newCount = currentCount + 1;
      localStorage.setItem('dhikr_site_visits', newCount.toString());
      
      // عرض العدد الفعلي بدون إضافات
      setVisitorCount(newCount);
    };

    updateVisitorCount();
  }, []);

  // فحص إكمال جميع الأذكار
  useEffect(() => {
    const currentDhikrList = dhikrData[currentDhikrType];
    const allCompleted = currentDhikrList.every(dhikr => 
      dhikrCounts[`${currentDhikrType}-${dhikr.id}`] >= dhikr.count
    );
    
    if (allCompleted && currentDhikrList.length > 0) {
      setShowCompletionModal(true);
    }
  }, [dhikrCounts, currentDhikrType]);

  // إخفاء نافذة التهنئة عند تغيير نوع الأذكار
  useEffect(() => {
    setShowCompletionModal(false);
  }, [currentDhikrType]);

  const handleDhikrClick = (type, id, targetCount) => {
    setDhikrCounts(prevCounts => {
      const newCount = prevCounts[`${type}-${id}`] + 1;
      if (newCount <= targetCount) {
        return {
          ...prevCounts,
          [`${type}-${id}`]: newCount,
        };
      } else {
        return prevCounts; // Do not increment if already reached target
      }
    });
  };

  const resetDhikrCount = (type, id) => {
    setDhikrCounts(prevCounts => ({
      ...prevCounts,
      [`${type}-${id}`]: 0,
    }));
    setShowCompletionModal(false);
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

  const currentDhikrList = dhikrData[currentDhikrType];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-emerald-800 dark:text-white mb-4">أذكار {currentDhikrType === 'morning' ? 'الصباح' : 'المساء'}</h1>
          <div className="w-32 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full"></div>
          <p className="text-emerald-700 dark:text-emerald-300 mt-4 text-lg">بسم الله نبدأ</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
            <button
              className={`px-8 py-4 mx-2 rounded-full text-lg font-semibold transition-all duration-300 ${
                currentDhikrType === 'morning' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-700 text-emerald-800 dark:text-emerald-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setCurrentDhikrType('morning')}
            >
              🌅 أذكار الصباح
            </button>
            <button
              className={`px-8 py-4 mx-2 rounded-full text-lg font-semibold transition-all duration-300 ${
                currentDhikrType === 'evening' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-700 text-emerald-800 dark:text-emerald-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setCurrentDhikrType('evening')}
            >
              🌙 أذكار المساء
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-4xl mx-auto">
          {currentDhikrList.map(dhikr => (
            <div key={dhikr.id} className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-emerald-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{dhikr.id}</span>
                </div>
                <p className="text-xl mb-4 leading-relaxed text-emerald-900 dark:text-emerald-100 font-medium">{dhikr.text}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-6 italic">{dhikr.reference}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 w-20"
                  onClick={() => handleDhikrClick(currentDhikrType, dhikr.id, dhikr.count)}
                  disabled={dhikrCounts[`${currentDhikrType}-${dhikr.id}`] >= dhikr.count}
                >
                  عدد المرات
                </button>
                
                <div className="bg-emerald-50 dark:bg-gray-700 px-4 py-2 rounded-full border-2 border-emerald-200 dark:border-gray-600">
                  <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {dhikrCounts[`${currentDhikrType}-${dhikr.id}`]}/{dhikr.count}
                  </span>
                </div>
                
                <button
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 w-20"
                  onClick={() => resetDhikrCount(currentDhikrType, dhikr.id)}
                >
                  إعادة
                </button>
              </div>
              
              {dhikrCounts[`${currentDhikrType}-${dhikr.id}`] >= dhikr.count && (
                <div className="mt-4 text-center">
                  <span className="inline-block bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-4 py-2 rounded-full text-sm font-semibold">
                    ✅ تم إكمال الذكر
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12 py-8">
          <p className="text-emerald-700 dark:text-emerald-300 text-lg">تقبل الله منا ومنكم صالح الأعمال</p>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto mt-4 rounded-full"></div>
          
          {/* زر إعادة تعيين جميع الأذكار */}
          <button
            className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
            onClick={resetAllDhikr}
          >
            إعادة تعيين جميع الأذكار
          </button>
        </div>

        {/* عداد الزوار */}
        <div className="text-center mt-8 pb-8">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-emerald-100 dark:border-gray-700 inline-block">
            <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-2">عدد زوار الموقع</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">👥</span>
              <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {visitorCount.toLocaleString('ar-SA')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة التهنئة عند إكمال جميع الأذكار */}
      {showCompletionModal && (
        <div className="completion-modal">
          <div className="completion-modal-content">
            <h3>أكملتم الأذكار وجزاكم الله خير ولا تنسونا من دعائكم</h3>
            <p>تقبل الله منكم صالح الأعمال</p>
            <button onClick={() => setShowCompletionModal(false)}>
              الحمد لله
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;



import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, UserProfile, DailyStats, AppTab, HealthGoal } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import MealPlanner from './components/MealPlanner';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);


  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nutrilens_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Alex',
      dailyGoal: 2200,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 70,
      weight: 75,
      height: 180,
      age: 28,
      goal: 'Maintain',
      allergies: [],
      preferences: [],
      waterReminderEnabled: false,
      waterReminderInterval: 60
    };
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('nutrilens_daily_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) return parsed;
    }
    return {
      date: new Date().toISOString().split('T')[0],
      calories: 0,
      water: 0,
      items: []
    };
  });

  // Background reminder effect
  const reminderTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile.waterReminderEnabled) {
      // Clear existing timer if any
      if (reminderTimerRef.current) window.clearInterval(reminderTimerRef.current);

      // Request permission if not already granted
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      reminderTimerRef.current = window.setInterval(() => {
        const notify = () => {
          if (Notification.permission === 'granted') {
            new Notification('Time to Hydrate! 💧', {
              body: 'Stay healthy and take a sip of water.',
              icon: 'https://cdn-icons-png.flaticon.com/512/3105/3105807.png'
            });
          } else {
            alert("Reminder: It's time to drink water! 💧");
          }
        };
        notify();
      }, profile.waterReminderInterval * 60 * 1000);
    }

    return () => {
      if (reminderTimerRef.current) window.clearInterval(reminderTimerRef.current);
    };
  }, [profile.waterReminderEnabled, profile.waterReminderInterval]);

  useEffect(() => {
    localStorage.setItem('nutrilens_daily_stats', JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    localStorage.setItem('nutrilens_profile', JSON.stringify(profile));
  }, [profile]);



  const handleAddWater = () => {
    setDailyStats(prev => ({ ...prev, water: prev.water + 1 }));
  };

  const handleRemoveWater = () => {
    setDailyStats(prev => ({ ...prev, water: Math.max(0, prev.water - 1) }));
  };

  const handleFoodLogged = (item: FoodItem) => {
    setDailyStats(prev => ({
      ...prev,
      calories: prev.calories + item.calories,
      items: [...prev.items, item]
    }));
    setActiveTab(AppTab.DASHBOARD);
  };

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };





  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto relative bg-slate-50 overflow-x-hidden">
      {activeTab === AppTab.DASHBOARD && (
        <Dashboard 
          stats={dailyStats} 
          profile={profile}
          onAddWater={handleAddWater}
          onRemoveWater={handleRemoveWater}
          onUpdateProfile={updateProfileField}
        />
      )}

      {activeTab === AppTab.PLANNER && (
        <MealPlanner profile={profile} />
      )}

      {activeTab === AppTab.SCAN && (
        <Scanner 
          onFoodLogged={handleFoodLogged} 
          onCancel={() => setActiveTab(AppTab.DASHBOARD)} 
        />
      )}

      {activeTab === AppTab.LOG && (
        <div className="p-6">
           <h2 className="text-2xl font-bold text-slate-800 mb-6">Activity Log</h2>
           <div className="space-y-4">
              {dailyStats.items.length === 0 ? (
                <p className="text-slate-400 text-center py-12">No items logged yet.</p>
              ) : (
                dailyStats.items.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                     <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-utensils text-emerald-200 text-2xl"></i>}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">P: {item.protein}g</span>
                           <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">C: {item.carbs}g</span>
                           <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">F: {item.fat}g</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-emerald-600">{item.calories}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">kcal</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {activeTab === AppTab.PROFILE && (
        <div className="p-6 pb-24">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Profile Settings</h2>

          </div>
          
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex flex-col items-center mb-8">
               <div className="relative mb-6">
                 <div className="w-24 h-24 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-emerald-500/20 transform rotate-3">
                    {profile.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400">
                    <i className="fa-solid fa-pen text-[10px]"></i>
                 </div>
               </div>
               <div className="text-center w-full">
                <input 
                  value={profile.name}
                  onChange={(e) => updateProfileField('name', e.target.value)}
                  placeholder="Full Name"
                  className="text-2xl font-black text-center bg-transparent border-b-2 border-transparent focus:border-emerald-500 outline-none w-full px-4 py-1 transition-all"
                />
                
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest text-center">Weight</p>
                  <div className="flex items-center justify-center gap-1">
                    <input 
                      type="number"
                      value={profile.weight}
                      onChange={(e) => updateProfileField('weight', Number(e.target.value))}
                      className="text-lg font-black bg-transparent outline-none w-full text-center text-slate-800"
                    />
                    <span className="text-[10px] font-bold text-slate-400">kg</span>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest text-center">Height</p>
                  <div className="flex items-center justify-center gap-1">
                    <input 
                      type="number"
                      value={profile.height}
                      onChange={(e) => updateProfileField('height', Number(e.target.value))}
                      className="text-lg font-black bg-transparent outline-none w-full text-center text-slate-800"
                    />
                    <span className="text-[10px] font-bold text-slate-400">cm</span>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest text-center">Age</p>
                  <div className="flex items-center justify-center gap-1">
                    <input 
                      type="number"
                      value={profile.age}
                      onChange={(e) => updateProfileField('age', Number(e.target.value))}
                      className="text-lg font-black bg-transparent outline-none w-full text-center text-slate-800"
                    />
                    <span className="text-[10px] font-bold text-slate-400">y/o</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Nutritional Strategy</p>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Primary Goal</label>
                      <select 
                        value={profile.goal}
                        onChange={(e) => updateProfileField('goal', e.target.value as HealthGoal)}
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border border-slate-100 appearance-none focus:border-emerald-500"
                      >
                         <option value="Weight Loss">Weight Loss</option>
                         <option value="Maintain">Maintain Weight</option>
                         <option value="Muscle Gain">Muscle Gain</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Daily Calorie Target</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={profile.dailyGoal}
                          onChange={(e) => updateProfileField('dailyGoal', Number(e.target.value))}
                          className="w-full p-4 bg-slate-50 rounded-2xl font-black text-slate-900 outline-none border border-slate-100 focus:border-emerald-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">kcal</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Target Macronutrients (g)</p>
                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Protein</label>
                      <input 
                        type="number"
                        value={profile.proteinGoal}
                        onChange={(e) => updateProfileField('proteinGoal', Number(e.target.value))}
                        className="w-full p-4 bg-orange-50 rounded-2xl font-black text-orange-700 outline-none border border-orange-100 text-center"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Carbs</label>
                      <input 
                        type="number"
                        value={profile.carbsGoal}
                        onChange={(e) => updateProfileField('carbsGoal', Number(e.target.value))}
                        className="w-full p-4 bg-emerald-50 rounded-2xl font-black text-emerald-700 outline-none border border-emerald-100 text-center"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Fat</label>
                      <input 
                        type="number"
                        value={profile.fatGoal}
                        onChange={(e) => updateProfileField('fatGoal', Number(e.target.value))}
                        className="w-full p-4 bg-indigo-50 rounded-2xl font-black text-indigo-700 outline-none border border-indigo-100 text-center"
                      />
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Dietary Preferences</p>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Allergies</label>
                      <input 
                        placeholder="e.g. peanuts, dairy"
                        value={profile.allergies.join(', ')}
                        onChange={(e) => updateProfileField('allergies', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none border border-slate-100 focus:border-emerald-500"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Cuisines</label>
                      <input 
                        placeholder="e.g. Tamil Nadu, Vegan"
                        value={profile.preferences.join(', ')}
                        onChange={(e) => updateProfileField('preferences', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none border border-slate-100 focus:border-emerald-500"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;

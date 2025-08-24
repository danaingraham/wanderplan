import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { storage, STORAGE_KEYS } from '../../utils/storage';

export function FixAccommodationData() {
  const { user } = useUser();
  const [fixed, setFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [fixedData, setFixedData] = useState<any>(null);

  const fixData = () => {
    if (!user?.id) {
      setError('No user logged in');
      return;
    }

    try {
      const prefsKey = `${STORAGE_KEYS.PREFERENCES}_${user.id}`;
      const prefs = storage.get<any>(prefsKey);
      
      if (!prefs) {
        setError('No preferences found');
        return;
      }

      setOriginalData(prefs.accommodation_style);
      
      // Fix accommodation_style if it exists
      if (prefs.accommodation_style) {
        // Ensure it's an array
        if (!Array.isArray(prefs.accommodation_style)) {
          prefs.accommodation_style = [prefs.accommodation_style];
        }
        
        // Fix any double-encoded JSON
        prefs.accommodation_style = prefs.accommodation_style.map((item: any) => {
          if (typeof item === 'string') {
            return {
              style: item,
              confidence: 1.0,
              last_seen: new Date().toISOString(),
              count: 1
            };
          }
          
          if (item && typeof item === 'object' && item.style) {
            // Check if style is double-encoded
            if (typeof item.style === 'string' && item.style.startsWith('{')) {
              try {
                const parsed = JSON.parse(item.style);
                return {
                  style: parsed.style || item.style,
                  confidence: item.confidence || 1.0,
                  last_seen: item.last_seen || new Date().toISOString(),
                  count: item.count || 1
                };
              } catch {
                return item;
              }
            }
            return item;
          }
          
          return null;
        }).filter(Boolean);
        
        // Remove duplicates
        const seen = new Set<string>();
        prefs.accommodation_style = prefs.accommodation_style.filter((item: any) => {
          const style = typeof item === 'string' ? item : item.style;
          if (seen.has(style)) {
            return false;
          }
          seen.add(style);
          return true;
        });
        
        // Save the fixed preferences
        storage.set(prefsKey, prefs);
        setFixedData(prefs.accommodation_style);
        setFixed(true);
        
        // Reload the page to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('No accommodation_style found to fix');
      }
    } catch (err) {
      console.error('Error fixing data:', err);
      setError('Failed to fix data: ' + (err as Error).message);
    }
  };

  const clearAccommodation = () => {
    if (!user?.id) {
      setError('No user logged in');
      return;
    }

    if (!confirm('This will clear your accommodation preferences. Are you sure?')) {
      return;
    }

    try {
      const prefsKey = `${STORAGE_KEYS.PREFERENCES}_${user.id}`;
      const prefs = storage.get<any>(prefsKey);
      
      if (prefs) {
        prefs.accommodation_style = [];
        storage.set(prefsKey, prefs);
        setFixed(true);
        
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error('Error clearing data:', err);
      setError('Failed to clear data: ' + (err as Error).message);
    }
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-900 mb-2">Fix Accommodation Data</h3>
      
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {fixed && (
        <div className="mb-2 p-2 bg-green-100 text-green-700 rounded">
          ✅ Data fixed! Page will reload...
        </div>
      )}
      
      {originalData && (
        <div className="mb-2 p-2 bg-gray-100 rounded">
          <p className="text-sm font-medium">Original data:</p>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(originalData, null, 2)}</pre>
        </div>
      )}
      
      {fixedData && (
        <div className="mb-2 p-2 bg-green-50 rounded">
          <p className="text-sm font-medium">Fixed data:</p>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(fixedData, null, 2)}</pre>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={fixData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fix Corrupted Data
        </button>
        <button
          onClick={clearAccommodation}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Accommodation
        </button>
      </div>
    </div>
  );
}
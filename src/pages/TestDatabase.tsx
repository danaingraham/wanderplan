import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseDb } from '../lib/supabaseDb';
import { useUser } from '../contexts/UserContext';

export function TestDatabase() {
  const { user } = useUser();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNewTable = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Test data that matches our new structure
      const testPreferences = {
        user_id: user.id,
        travel_pace: 'moderate',
        budget_range: { min: 100, max: 300 },
        accommodation_type: ['hotel', 'airbnb'],
        dietary_restrictions: ['vegetarian'],
        trip_style: ['couple'],
        weather_preference: 'warm'
      };

      console.log('Testing new table with user:', user.id);
      console.log('Attempting to insert:', testPreferences);
      
      // Try to insert test data WITH timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000);
      });

      // Try with the separate DB client
      console.log('Using separate DB client...');
      const insertPromise = supabaseDb
        .from('user_preferences')
        .upsert(testPreferences)
        .select()
        .single();

      const { data: insertData, error: insertError } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;
      
      if (insertError) {
        setResult({ 
          success: false,
          error: 'Insert failed',
          details: insertError
        });
        console.error('Insert error:', insertError);
        return;
      }

      console.log('Insert successful:', insertData);
      
      // Try to read it back with DB client
      const { data: readData, error: readError } = await supabaseDb
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (readError) {
        setResult({ 
          success: false,
          error: 'Read failed',
          details: readError
        });
        console.error('Read error:', readError);
        return;
      }

      console.log('Read successful:', readData);
      setResult({ 
        success: true, 
        message: '✅ New table works perfectly!',
        inserted: insertData,
        retrieved: readData
      });

    } catch (err: any) {
      console.error('Unexpected error:', err);
      setResult({ 
        success: false,
        error: 'Unexpected error',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testAnyTable = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing if ANY table works...');
      
      // Test a simple query on profiles table
      const { data, error } = await supabaseDb
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Profiles table error:', error);
        setResult({
          success: false,
          error: 'Even profiles table failed',
          details: error
        });
      } else {
        console.log('Profiles table works!', data);
        setResult({
          success: true,
          message: '✅ Other tables work! Issue is specific to user_preferences',
          data
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: 'Exception',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test New Database Table</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <strong>User:</strong> {user?.email || 'Not authenticated'}
        </p>
        <p className="text-blue-800">
          <strong>User ID:</strong> {user?.id || 'N/A'}
        </p>
      </div>

      <button
        onClick={testNewTable}
        disabled={loading || !user}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-lg font-semibold"
      >
        {loading ? 'Testing...' : 'Test New Table Structure'}
      </button>

      {result && (
        <div className={`mt-6 rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <>
              <h3 className="text-green-800 font-semibold mb-2">{result.message}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-green-700 font-medium">Data Inserted:</h4>
                  <pre className="text-green-600 text-sm bg-white p-2 rounded mt-1">
                    {JSON.stringify(result.inserted, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-green-700 font-medium">Data Retrieved:</h4>
                  <pre className="text-green-600 text-sm bg-white p-2 rounded mt-1">
                    {JSON.stringify(result.retrieved, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-red-800 font-semibold mb-2">❌ {result.error}</h3>
              <pre className="text-red-600 text-sm bg-white p-2 rounded">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
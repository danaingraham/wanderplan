import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

export function PreferencesFetchTest() {
  const { user } = useUser();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    setResult(null);

    console.log('=== PREFERENCE FETCH TEST ===');
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);

    if (!user?.id) {
      const msg = 'No user ID available';
      console.error(msg);
      setResult({ error: msg });
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to fetch preferences...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000);
      });

      const queryPromise = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      console.log('Fetch complete:');
      console.log('- Data:', data);
      console.log('- Error:', error);

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No preferences found (this is OK for new users)');
          setResult({ 
            message: 'No preferences found', 
            userId: user.id,
            error: null 
          });
        } else {
          console.error('Error fetching preferences:', error);
          setResult({ 
            error: error.message, 
            errorCode: error.code,
            userId: user.id 
          });
        }
      } else {
        console.log('Successfully fetched preferences!');
        setResult({ 
          success: true, 
          data, 
          userId: user.id 
        });
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setResult({ 
        error: err.message, 
        unexpected: true,
        userId: user.id 
      });
    } finally {
      setLoading(false);
      console.log('=== END PREFERENCE FETCH TEST ===');
    }
  };

  const testCreate = async () => {
    setLoading(true);
    setResult(null);

    console.log('=== PREFERENCE CREATE TEST ===');
    
    if (!user?.id) {
      const msg = 'No user ID available';
      console.error(msg);
      setResult({ error: msg });
      setLoading(false);
      return;
    }

    try {
      const testData = {
        user_id: user.id,
        travel_pace: 'moderate',
        budget_range: { min: 50, max: 100 },
        accommodation_type: ['hotel'],
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to create preferences with:', testData);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 3 seconds')), 3000);
      });

      const queryPromise = supabase
        .from('user_preferences')
        .upsert(testData)
        .select()
        .single();

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      console.log('Create complete:');
      console.log('- Data:', data);
      console.log('- Error:', error);

      if (error) {
        console.error('Error creating preferences:', error);
        setResult({ 
          error: error.message, 
          errorCode: error.code,
          userId: user.id 
        });
      } else {
        console.log('Successfully created preferences!');
        setResult({ 
          success: true, 
          created: true,
          data, 
          userId: user.id 
        });
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setResult({ 
        error: err.message, 
        unexpected: true,
        userId: user.id 
      });
    } finally {
      setLoading(false);
      console.log('=== END PREFERENCE CREATE TEST ===');
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-yellow-900 mb-2">Preference Fetch Test (Dev Only)</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testFetch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 mr-2"
        >
          {loading ? 'Testing...' : 'Test Fetch'}
        </button>
        
        <button
          onClick={testCreate}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Create'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded p-3 text-sm">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <p className="text-xs text-yellow-700 mt-2">
        Check browser console for detailed logs
      </p>
    </div>
  );
}
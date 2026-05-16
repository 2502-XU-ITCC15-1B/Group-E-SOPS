useEffect(() => {
  const testBackend = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/v1/projects/demo-no-project/databases/(default)/documents');
      const data = await response.json();
      console.log('✅ Firestore is accessible:', data);
    } catch (error) {
      console.error('❌ Firestore error:', error);
    }
  };
  
  testBackend();
}, []);
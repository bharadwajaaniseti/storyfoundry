const testCreateProject = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Project',
        logline: 'A test project for API testing',
        description: 'This is a test project created to verify the API is working',
        format: 'Feature Film',
        genre: 'Drama',
        visibility: 'private',
        ai_enabled: true,
        ip_protection_enabled: true
      }),
      credentials: 'include' // Include cookies for authentication
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testCreateProject();

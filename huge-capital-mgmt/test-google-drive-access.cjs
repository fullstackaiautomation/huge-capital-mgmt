const fs = require('fs');
const crypto = require('crypto');

// Test Google Drive API access with the service account
async function testGoogleDriveAccess() {
  console.log('🔐 Testing Google Drive API Access...\n');

  // Load the service account JSON
  const serviceAccountPath = 'C:\\Users\\blkw\\Downloads\\huge-brain-958c00591a9a.json';
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const PARENT_FOLDER_ID = '1OTlXiFmJXF8moKgirN9hBk2uxS5QiGG6';
  const IMPERSONATED_USER = 'taylor@fullstackaiautomation.com'; // Your email address

  console.log('📧 Service Account:', serviceAccount.client_email);
  console.log('👤 Impersonating:', IMPERSONATED_USER);
  console.log('📁 Parent Folder ID:', PARENT_FOLDER_ID);
  console.log();

  // Function to create JWT for Google OAuth
  function base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  function createJWT(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const payload = {
      iss: serviceAccount.client_email,
      sub: IMPERSONATED_USER, // Impersonate this user
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Sign the token
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(serviceAccount.private_key);
    const encodedSignature = signature.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${unsignedToken}.${encodedSignature}`;
  }

  // Get access token
  async function getAccessToken() {
    console.log('🔑 Requesting access token...');
    const jwt = createJWT(serviceAccount);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to get access token:', error);
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Access token obtained\n');
    return data.access_token;
  }

  // Test: Get parent folder info
  async function getParentFolderInfo(token) {
    console.log('📂 Testing access to parent folder...');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${PARENT_FOLDER_ID}?fields=id,name,mimeType,capabilities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to access parent folder:', error);
      return null;
    }

    const folder = await response.json();
    console.log('✅ Parent folder accessed successfully!');
    console.log('   Name:', folder.name);
    console.log('   ID:', folder.id);
    console.log('   Type:', folder.mimeType);
    console.log('   Can Create Files:', folder.capabilities?.canAddChildren || 'Unknown');
    console.log();
    return folder;
  }

  // Test: Create a test folder
  async function createTestFolder(token) {
    console.log('📁 Creating test folder...');

    const testFolderName = `Test Upload - ${new Date().toISOString().split('T')[0]} ${Date.now()}`;

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: testFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [PARENT_FOLDER_ID],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create test folder:', error);
      return null;
    }

    const folder = await response.json();
    console.log('✅ Test folder created successfully!');
    console.log('   Name:', folder.name);
    console.log('   ID:', folder.id);
    console.log('   Link:', folder.webViewLink);
    console.log();
    return folder;
  }

  // Test: Upload a test file
  async function uploadTestFile(token, folderId) {
    console.log('📄 Uploading test file...');

    const testContent = 'This is a test file from the Google Drive integration test.';
    const fileName = 'test-file.txt';

    const metadata = {
      name: fileName,
      mimeType: 'text/plain',
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([testContent], { type: 'text/plain' }), fileName);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to upload test file:', error);
      return null;
    }

    const file = await response.json();
    console.log('✅ Test file uploaded successfully!');
    console.log('   Name:', file.name);
    console.log('   ID:', file.id);
    console.log('   Link:', file.webViewLink);
    console.log();
    return file;
  }

  try {
    const token = await getAccessToken();
    const parentFolder = await getParentFolderInfo(token);

    if (!parentFolder) {
      console.error('\n❌ FAILED: Cannot access parent folder');
      console.error('   Please ensure the service account has been granted access to the folder');
      console.error(`   Share the folder with: ${serviceAccount.client_email}`);
      return;
    }

    const testFolder = await createTestFolder(token);

    if (!testFolder) {
      console.error('\n❌ FAILED: Cannot create folder in parent directory');
      console.error('   The service account may not have write permissions');
      return;
    }

    const testFile = await uploadTestFile(token, testFolder.id);

    if (!testFile) {
      console.error('\n❌ FAILED: Cannot upload file to folder');
      return;
    }

    console.log('✨ All tests passed!\n');
    console.log('🎉 Google Drive integration is working correctly!');
    console.log('🔗 View your test folder:', testFolder.webViewLink);

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error(error);
  }
}

testGoogleDriveAccess();
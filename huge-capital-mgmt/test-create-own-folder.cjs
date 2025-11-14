const fs = require('fs');
const crypto = require('crypto');

// Test creating a folder in the root of the service account's Drive
async function testCreateOwnFolder() {
  console.log('🔐 Testing Google Drive by creating our own folder...\n');

  // Load the service account JSON
  const serviceAccountPath = 'C:\\Users\\blkw\\Downloads\\huge-brain-958c00591a9a.json';
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  console.log('📧 Service Account:', serviceAccount.client_email);
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
      scope: 'https://www.googleapis.com/auth/drive.file',
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

  // Create a parent folder in the service account's root
  async function createParentFolder(token) {
    console.log('📁 Creating parent folder in service account Drive...');

    const folderName = 'Huge Capital - Deal Documents';

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create parent folder:', error);
      return null;
    }

    const folder = await response.json();
    console.log('✅ Parent folder created successfully!');
    console.log('   Name:', folder.name);
    console.log('   ID:', folder.id);
    console.log('   Link:', folder.webViewLink);
    console.log();
    return folder;
  }

  // Create a test subfolder
  async function createTestFolder(token, parentId) {
    console.log('📁 Creating test subfolder...');

    const testFolderName = `Test Upload - ${new Date().toISOString().split('T')[0]}`;

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
          parents: [parentId],
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

  // Upload a test file
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
    const parentFolder = await createParentFolder(token);

    if (!parentFolder) {
      console.error('\n❌ FAILED: Cannot create parent folder');
      return;
    }

    const testFolder = await createTestFolder(token, parentFolder.id);

    if (!testFolder) {
      console.error('\n❌ FAILED: Cannot create subfolder');
      return;
    }

    const testFile = await uploadTestFile(token, testFolder.id);

    if (!testFile) {
      console.error('\n❌ FAILED: Cannot upload file');
      return;
    }

    console.log('✨ All tests passed!\n');
    console.log('🎉 Google Drive integration is working correctly!');
    console.log('📁 Parent Folder ID:', parentFolder.id);
    console.log('🔗 View your test folder:', testFolder.webViewLink);
    console.log();
    console.log('🔧 Next Steps:');
    console.log(`   1. Update the Supabase secret GOOGLE_DRIVE_PARENT_FOLDER_ID to: ${parentFolder.id}`);
    console.log('   2. The service account can now create folders and upload files!');

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error(error);
  }
}

testCreateOwnFolder();
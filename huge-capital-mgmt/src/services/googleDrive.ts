/**
 * Google Drive integration service for the Deals feature
 * Handles folder creation, file uploads, and link management
 */

interface GoogleDriveConfig {
  serviceAccountJson: string; // Service account JSON from Supabase secrets
  parentFolderId: string; // Parent folder where all deal folders will be created
}

interface DealFolder {
  id: string;
  name: string;
  webViewLink: string;
}

class GoogleDriveService {
  private config: GoogleDriveConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config?: GoogleDriveConfig) {
    this.config = config || null;
  }

  /**
   * Initialize service with environment variables
   * Should be called from an edge function with service account access
   */
  static async initialize(): Promise<GoogleDriveService> {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

    if (!serviceAccountJson || !parentFolderId) {
      throw new Error('Missing Google Drive configuration in environment variables');
    }

    return new GoogleDriveService({
      serviceAccountJson,
      parentFolderId,
    });
  }

  /**
   * Get or refresh access token for service account
   */
  private async getAccessToken(): Promise<string | null> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    if (!this.config) {
      throw new Error('GoogleDriveService not configured');
    }

    try {
      const serviceAccount = JSON.parse(this.config.serviceAccountJson);

      // Create JWT assertion
      const header = {
        alg: 'RS256',
        typ: 'JWT',
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      // Note: In actual implementation, would need to sign JWT
      // This is a placeholder - real implementation would use crypto library
      const jwt = await this.signJWT(header, payload, serviceAccount.private_key);

      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token || null;
      this.tokenExpiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);

      return this.accessToken ?? null;
    } catch (error) {
      console.error('Failed to get Google Drive access token:', error);
      throw new Error('Google Drive authentication failed');
    }
  }

  /**
   * Sign JWT with service account private key
   * This is a simplified version - would need crypto implementation in real code
   */
  private async signJWT(header: any, payload: any, _privateKey: string): Promise<string> {
    // This would use a JWT library in the actual implementation
    // For now, return placeholder that would be replaced
    return Buffer.from(JSON.stringify(header)).toString('base64') +
           '.' +
           Buffer.from(JSON.stringify(payload)).toString('base64') +
           '.signature';
  }

  /**
   * Create a folder for a new deal in Google Drive
   */
  async createDealFolder(legalBusinessName: string, submissionDate: Date): Promise<DealFolder> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain Google Drive access token');
    }

    if (!this.config) {
      throw new Error('GoogleDriveService not configured');
    }

    const folderName = `${legalBusinessName} - ${submissionDate.toISOString().split('T')[0]}`;

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [this.config.parentFolderId],
          description: `Deal submission folder for ${legalBusinessName}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const folder = await response.json();
      return {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
      };
    } catch (error) {
      console.error('Failed to create Google Drive folder:', error);
      throw error;
    }
  }

  /**
   * Upload a file to a Google Drive folder
   */
  async uploadFile(
    folderId: string,
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer,
  ): Promise<{ id: string; webViewLink: string }> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain Google Drive access token');
    }

    try {
      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileBuffer], { type: mimeType }));

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        },
      );

      if (!response.ok) {
        throw new Error(`Google Drive upload failed: ${response.statusText}`);
      }

      const file = await response.json();
      return {
        id: file.id,
        webViewLink: file.webViewLink,
      };
    } catch (error) {
      console.error('Failed to upload file to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Share a folder with a specific user
   */
  async shareFolderWithUser(folderId: string, email: string): Promise<void> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain Google Drive access token');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to share folder: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to share Google Drive folder:', error);
      throw error;
    }
  }

  /**
   * Get a file from Google Drive
   */
  async getFileMetadata(fileId: string): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain Google Drive access token');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=*`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Google Drive file metadata:', error);
      throw error;
    }
  }
}

export default GoogleDriveService;

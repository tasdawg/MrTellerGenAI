// =================================================================
// APP CONFIGURATION DEFAULTS
// =================================================================
// This file contains the default configuration for the application.
// These settings can be overridden by the user in the app's UI.
// Credentials should NOT be stored here.
// =================================================================

export const CONFIG = {
    // S3 (MiniIO) Configuration Defaults
    // These values are placeholders. The user MUST configure their S3
    // credentials in the "Collection" tab of the application.
    s3: {
        accessKeyId: '',
        secretAccessKey: '',
        endpoint: '', // e.g., 'http://127.0.0.1:9000'
        bucketName: 'image-gen',
        region: 'us-east-1',
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
        sslEnabled: false,
    },

    // Add other configurations here in the future
    // e.g., api: { ... }
};

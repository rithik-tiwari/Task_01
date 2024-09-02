<template>
  <div>
    <h1>Excel File Upload</h1>
    <input type="file" @change="handleFileUpload" accept=".xlsx,.xls" />
    <button @click="uploadFile" :disabled="!file">Upload</button>
    <button @click="downloadShipmentsFile">Download Sample</button>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      file: null,
      message: ''
    };
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadFile() {
      if (!this.file) {
        this.message = 'Please select a file first.';
        return;
      }

      const formData = new FormData();
      formData.append('file', this.file);

      try {
        const response = await axios.post('http://localhost:3000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.message = response.data.message;
      } catch (error) {
        this.message = 'Error uploading file. Please try again.';
        console.error(error);
      }
    },
    async downloadShipmentsFile() {
      try {
        // Make a GET request to fetch the file as a Blob
        const response = await axios.get('../', {
          responseType: 'blob'
        });

        // Create a URL for the Blob object
        const url = window.URL.createObjectURL(new Blob([response.data]));

        // Create an anchor element and simulate a click to start the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'shipments.xlsx');
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        this.message = 'Error downloading file. Please try again.';
        console.error(error);
      }
    }
  }
};
</script>
<template>
  <div>
    <h1>Excel File Upload</h1>
    <input type="file" @change="handleFileUpload" accept=".xlsx,.xls" />
    <button @click="uploadFile" :disabled="!file">Upload</button>
    <button @click="downloadSampleFormat">Download Sample Format</button>
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
    downloadSampleFormat() {
      // In a real application, this would be a link to a pre-generated sample Excel file
      const sampleFileUrl = '/sample-excel-format.xlsx';
      window.open(sampleFileUrl, '_blank');
    }
  }
};
</script>
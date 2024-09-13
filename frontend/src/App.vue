<template>
  <div class="container">
    <!-- Navbar -->
    <nav class="navbar">
      <img src="./assets/pando_logo.png" alt="Pando Logo" class="logo" />
      <h1>Shipment File Upload</h1>
    </nav>

    <!-- Heading -->
    <div class="heading">
      <h1>Upload the Shipment Data</h1>
    </div>

    <!-- Upload Section -->
    <div class="upload-section">
      <input type="file" @change="handleFileUpload" accept=".xlsx,.xls" class="file-input" />
      <div class="button-group">
        <button @click="uploadFile" :disabled="!file" class="btn btn-upload">Upload</button>
        <button @click="downloadShipmentsFile" class="btn btn-download">Download Sample</button>
      </div>
      <p v-if="message" :class="messageClass">{{ message }}</p>
    </div>

    <!-- View Section -->
    <div class="view-section">
      <div class="button-group">
        <button @click="fetchMongoData" class="btn btn-show">Show MongoDB Data</button>
        <button @click="fetchPostgresData" class="btn btn-show">Show PostgreSQL Data</button>
        <button @click="fetchLocationData" class="btn btn-show">Show Location Data</button>
      </div>

      <!-- Shipment Data Tables -->
      <div class="tables-container" v-if="showMongoData || showPostgresData || showLocationData">
        <!-- MongoDB Data Table -->
        <div class="table-container" v-if="showMongoData">
          <h2>MongoDB Data</h2>
          <table v-if="mongoData.length">
            <thead>
              <tr>
                <th>ID</th>
                <th>Shipment Type</th>
                <th>Order Number</th>
                <th>Order Type</th>
                <th>Source Reference ID</th>
                <th>Destination Reference ID</th>
                <th>Primary Mode</th>
                <th>Expected Delivery Date</th>
                <th>Incoterm</th>
                <th>Cargo Type</th>
                <th>Material Code</th>
                <th>Quantity</th>
                <th>Quantity Unit</th>
                <th>Shipment Number</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in mongoData" :key="shipment.id">
                <td>{{ shipment._id }}</td>
                <td>{{ shipment.ShipmentType }}</td>
                <td>{{ shipment.OrderNumber }}</td>
                <td>{{ shipment.OrderType }}</td>
                <td>{{ shipment.SourceReferenceID }}</td>
                <td>{{ shipment.DestinationReferenceID }}</td>
                <td>{{ shipment.PrimaryMode }}</td>
                <td>{{ shipment.ExpectedDeliveryDate }}</td>
                <td>{{ shipment.Incoterm }}</td>
                <td>{{ shipment.CargoType }}</td>
                <td>{{ shipment.MaterialCode }}</td>
                <td>{{ shipment.Quantity }}</td>
                <td>{{ shipment.QuantityUnit }}</td>
                <td>{{ shipment.ShipmentNumber }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else>No MongoDB data available.</p>
        </div>


        <!-- PostgreSQL Data Table -->
        <div class="table-container" v-if="showPostgresData">
          <h2>PostgreSQL Data</h2>
          <table v-if="postgresData.length">
            <thead>
              <tr>
                <th>ID</th>
                <th>Shipment Type</th>
                <th>Order Number</th>
                <th>Order Type</th>
                <th>Source Reference ID</th>
                <th>Destination Reference ID</th>
                <th>Primary Mode</th>
                <th>Expected Delivery Date</th>
                <th>Incoterm</th>
                <th>Cargo Type</th>
                <th>Material Code</th>
                <th>Quantity</th>
                <th>Quantity Unit</th>
                <th>Shipment Number</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in postgresData" :key="shipment.id">
                <td>{{ shipment.id }}</td>
                <td>{{ shipment.shipmentType }}</td>
                <td>{{ shipment.orderNumber }}</td>
                <td>{{ shipment.orderType }}</td>
                <td>{{ shipment.sourceReferenceId }}</td>
                <td>{{ shipment.destinationReferenceId }}</td>
                <td>{{ shipment.primaryMode }}</td>
                <td>{{ shipment.expectedDeliveryDate }}</td>
                <td>{{ shipment.incoterm }}</td>
                <td>{{ shipment.cargoType }}</td>
                <td>{{ shipment.materialCode }}</td>
                <td>{{ shipment.quantity }}</td>
                <td>{{ shipment.quantityUnit }}</td>
                <td>{{ shipment.shipmentNumber }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else>No PostgreSQL data available.</p>
        </div>

        <!-- Location Data Table -->
        <div class="table-container" v-if="showLocationData">
          <h2>Location Data</h2>
          <table v-if="locationData.length">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Location</th> 
                <th>Created At</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in locationData" :key="shipment.id">
                <td>{{ shipment.id }}</td>
                <td>{{ shipment.referenceId }}</td>
                <td>{{ shipment.createdAt }}</td>
                <td>{{ shipment.updatedAt }}</td>
              </tr>
            </tbody>
          </table>

          <p v-else>No Location data available.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      file: null,
      message: '',
      mongoData: [],
      postgresData: [],
      locationData: [],
      showMongoData: false,
      showPostgresData: false,
      showLocationData: false,
      messageType: '' // 'error' or 'success'
    };
  },
  computed: {
    messageClass() {
      return this.messageType === 'error' ? 'message error' : 'message success';
    }
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0];
    },
    async uploadFile() {
      try {
        const formData = new FormData();
        formData.append('file', this.file); // Ensure 'selectedFile' contains the file object

        const response = await axios.post('http://localhost:3000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          // Handling successful file upload and processing
          this.message = response.data.message;
          this.messageType = 'success';
        } else {
          // Handle unexpected response status codes
          this.message = 'Unexpected response from the server. Please try again.';
          this.messageType = 'error';
        }
      } catch (error) {
        if (error.response && error.response.data) {
          // Backend-specific error message from the server
          this.message = error.response.data.message;
        } else {
          // Generic error message if no detailed error is provided
          this.message = 'Error uploading file. Please try again.';
        }
        this.messageType = 'error';
        console.error(error);
      }
    },

    downloadShipmentsFile() {
      const link = document.createElement('a');
      link.href = 'http://localhost:3000/files/sample-file.xlsx'; // Correct URL to match your server route
      link.download = 'sample-file.xlsx'; // Filename for the downloaded file
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    async fetchMongoData() {
      try {
        const response = await axios.get('http://localhost:3000/data/mongo');
        this.mongoData = response.data;
        this.showMongoData = true;
        this.showPostgresData = false;
        this.showLocationData = false;
        this.showCitiesData = false;
      } catch (error) {
        console.error('Error fetching MongoDB data:', error);
      }
    },
    async fetchPostgresData() {
      try {
        const response = await axios.get('http://localhost:3000/data/postgres');
        this.postgresData = response.data;
        this.showPostgresData = true;
        this.showMongoData = false;
        this.showLocationData = false;
        this.showCitiesData = false; 
      } catch (error) {
        console.error('Error fetching PostgreSQL data:', error);
      }
    },
    async fetchLocationData() {
      try {
        const response = await axios.get('http://localhost:3000/data/location');
        this.locationData = response.data;
        this.showLocationData = true;
        this.showMongoData = false;
        this.showPostgresData = false;
        this.showCitiesData = false;
      } catch (error) {
        console.error('Error fetching Location data:',error);
      }
    },
  }
};
</script>

<style scoped>
.container {
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: transparent;
  font-family: 'Arial', sans-serif;
}

.navbar {
  width: 100%;
  background-color: white;
  color: #3687f1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
}

.logo {
  height: 60px;
  width: 200px;
  margin-right: 20px;
}

.navbar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 600px;
  padding: 30px;
  background-color: transparent;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: 80px;
}

.heading {
  font: bold;
  text-decoration: underline;
  margin-top: 100px;
}

.file-input {
  margin-bottom: 20px;
  padding: 10px;
  border: 2px solid white;
  border-radius: 5px;
}

.button-group {
  display: flex;
  gap: 15px;
}

.btn {
  border: none;
  padding: 12px 25px;
  border-radius: 5px;
  cursor: pointer;
  color: white;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn-upload {
  background-color: #4caf50;
}

.btn-upload:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.btn-download {
  background-color: #2196f3;
}

.btn-download:hover {
  background-color: #1976d2;
}

.btn-show {
  background-color: #ff9800;
  margin-top: 20px;
}

.btn-show:hover {
  background-color: #f57c00;
}

.message {
  margin-top: 20px;
  color: #5be20d;
  font-weight: bold;
}

.table-container {
  margin-top: 30px;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background-color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  padding: 12px;
  text-align: left;
  border: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
}

tr:hover {
  background-color: #f1f1f1;
}
</style>

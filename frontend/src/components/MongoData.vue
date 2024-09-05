<!-- <template>
    <div class="data-container">
      <h2>Data from MongoDB</h2>
      <table v-if="data.length">
        <thead>
          <tr>
            <th v-for="(value, key) in data[0]" :key="key">{{ key }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="(value, key) in item" :key="key">{{ value }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>No data available.</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        data: []
      };
    },
    async created() {
      try {
        const response = await axios.get('http://localhost:3000/data/mongo');
        this.data = response.data;
      } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
      }
    }
  };
  </script>
  
  <style scoped>
  .data-container {
    padding: 20px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: left;
  }
  
  th {
    background-color: #f2f2f2;
  }
  </style>
   -->
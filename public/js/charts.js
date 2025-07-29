/* ------------------- ✅ CHARTS SECTION ------------------- */
// Chart instances tracker
const chartInstances = {};

function loadChartsPage() {
  // Clear existing charts first
  destroyAllCharts();
  
  // Load new content
  $("#main-content").html(`
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">📊 Orders Status (Bar Chart)</h5>
          </div>
          <div class="card-body">
            <canvas id="ordersBarChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">📈 Monthly Sales (Line Chart)</h5>
          </div>
          <div class="card-body">
            <canvas id="salesLineChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">🍰 Product Categories (Pie Chart)</h5>
          </div>
          <div class="card-body">
            <canvas id="categoriesPieChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `);
  
  loadChartsData();
}

function destroyAllCharts() {
  Object.values(chartInstances).forEach(chart => chart?.destroy());
  Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
}

function loadChartsData() {
  const token = localStorage.getItem("token");

  // ✅ 1. Orders Status Bar Chart (unchanged)
  $.ajax({
    url: API_ORDERS,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    success: (orders) => {
      const statusCounts = {
        Pending: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0
      };
      orders.data.forEach(order => statusCounts[order.status]++);
      renderBarChart("ordersBarChart", Object.keys(statusCounts), Object.values(statusCounts), "Order Status Distribution");
    }
  });

  // ✅ 2. Monthly Sales Line Chart (unchanged)
  $.ajax({
    url: `${API_ORDERS}/monthly-sales`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    success: (monthlySales) => {
      const months = monthlySales.map(item => item.month);
      const totals = monthlySales.map(item => item.total_sales);
      renderLineChart("salesLineChart", months, totals, "Monthly Sales (₱)");
    },
    error: () => {
      renderLineChart("salesLineChart", 
        ["Jan", "Feb", "Mar", "Apr", "May"], 
        [5000, 8000, 12000, 6000, 15000], 
        "Monthly Sales (₱)"
      );
    }
  });

  // ✅ 3. UPDATED Product Categories Pie Chart (Dynamic Counting)
  $.ajax({
    url: API_PRODUCTS,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    success: (products) => {
      console.log("Fetched products:", products); // Debug log
      
      // Initialize counters for all valid categories
      const validCategories = ['Shirt', 'Bottoms', 'Accessories'];
      const categoryCounts = {};
      validCategories.forEach(cat => categoryCounts[cat] = 0);

      // Count products normally (1 count per product)
      products.forEach(product => {
        if (validCategories.includes(product.category)) {
          categoryCounts[product.category]++;
        } else {
          console.warn(`Invalid category found: ${product.category}`);
        }
      });

      console.log("Final counts:", categoryCounts); // Debug log
      
      // Prepare chart data (filter out zero counts)
      const labels = Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0);
      const data = labels.map(k => categoryCounts[k]);

      renderPieChart("categoriesPieChart", labels, data, "Products by Category");
    },
    error: (error) => {
      console.error("Error loading products:", error);
      Swal.fire("Error", "Failed to load product data", "error");
    }
  });
}

/* ------------------- ✅ RENDER CHARTS ------------------- */
function renderBarChart(canvasId, labels, data, title) {
  const ctx = document.getElementById(canvasId);
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderLineChart(canvasId, labels, data, title) {
  const ctx = document.getElementById(canvasId);
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderPieChart(canvasId, labels, data, title) {
  const ctx = document.getElementById(canvasId);
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',    // Red for Shirt
          'rgba(54, 162, 235, 0.7)',     // Blue for Bottoms
          'rgba(255, 206, 86, 0.7)',     // Yellow for Accessories
          'rgba(75, 192, 192, 0.7)',     // Green for others
          'rgba(153, 102, 255, 0.7)'     // Purple for others
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value} ${value === 1 ? 'item' : 'items'}`;
            }
          }
        }
      }
    }
  });
}

// Initialize only if on charts page
$(document).ready(function() {
  if ($("#ordersBarChart").length) {
    loadChartsPage();
  }
});
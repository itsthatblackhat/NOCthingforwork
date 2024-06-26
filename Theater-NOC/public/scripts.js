document.addEventListener('DOMContentLoaded', () => {
    const deviceList = document.getElementById('device-list');
    const statusBoxes = document.getElementById('status-boxes');
    const deviceDetails = document.getElementById('device-details');
    const notificationList = document.getElementById('notification-list');

    const addDeviceModal = document.getElementById('add-device-modal');
    const editDeviceModal = document.getElementById('edit-device-modal');
    const deleteDeviceModal = document.getElementById('delete-device-modal');

    const closeAddDeviceModal = document.getElementById('close-add-device-modal');
    const closeEditDeviceModal = document.getElementById('close-edit-device-modal');
    const closeDeleteDeviceModal = document.getElementById('close-delete-device-modal');

    const addDeviceForm = document.getElementById('add-device-form');
    const editDeviceForm = document.getElementById('edit-device-form');
    const confirmDeleteDeviceButton = document.getElementById('confirm-delete-device');

    const view1 = document.getElementById('view1');
    const view2 = document.getElementById('view2');

    let currentDevice = null;
    let currentDeleteDevice = null;

    document.getElementById('view1-button').addEventListener('click', () => {
        view1.classList.add('active');
        view2.classList.remove('active');
        loadDeviceListView();
    });

    document.getElementById('view2-button').addEventListener('click', () => {
        view1.classList.remove('active');
        view2.classList.add('active');
        loadDeviceDetailsView(currentDevice);
    });

    document.getElementById('add-device').addEventListener('click', () => {
        addDeviceModal.style.display = 'block';
    });

    closeAddDeviceModal.addEventListener('click', () => {
        addDeviceModal.style.display = 'none';
    });

    closeEditDeviceModal.addEventListener('click', () => {
        editDeviceModal.style.display = 'none';
    });

    closeDeleteDeviceModal.addEventListener('click', () => {
        deleteDeviceModal.style.display = 'none';
    });

    addDeviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addDeviceForm);
        const deviceData = Object.fromEntries(formData.entries());
        fetch('/api/add-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceData),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Device added:', data);
                addDeviceModal.style.display = 'none';
                loadDeviceListView();
            })
            .catch(error => {
                console.error('Error adding device:', error);
            });
    });

    editDeviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(editDeviceForm);
        const deviceData = Object.fromEntries(formData.entries());
        deviceData.originalAlias = currentDevice;
        fetch('/api/edit-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceData),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Device edited:', data);
                editDeviceModal.style.display = 'none';
                loadDeviceListView();
            })
            .catch(error => {
                console.error('Error editing device:', error);
            });
    });

    confirmDeleteDeviceButton.addEventListener('click', () => {
        fetch('/api/delete-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias: currentDeleteDevice }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Device deleted:', data);
                deleteDeviceModal.style.display = 'none';
                loadDeviceListView();
            })
            .catch(error => {
                console.error('Error deleting device:', error);
            });
    });

    function loadDeviceListView() {
        fetch('/api/get-devices')
            .then(response => response.json())
            .then(devices => {
                deviceList.innerHTML = '';
                statusBoxes.innerHTML = '';
                devices.forEach(device => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = '#';
                    a.textContent = device.alias;
                    a.dataset.device = device.alias;
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        currentDevice = e.target.dataset.device;
                        view1.classList.remove('active');
                        view2.classList.add('active');
                        loadDeviceDetailsView(currentDevice);
                    });
                    li.appendChild(a);

                    const editButton = document.createElement('a');
                    editButton.href = '#';
                    editButton.className = 'edit-device';
                    editButton.textContent = '🅴';
                    editButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        openEditDeviceModal(device.alias);
                    });
                    li.appendChild(editButton);

                    const deleteButton = document.createElement('a');
                    deleteButton.href = '#';
                    deleteButton.className = 'delete-device';
                    deleteButton.textContent = 'ⓓ';
                    deleteButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        openDeleteDeviceModal(device.alias);
                    });
                    li.appendChild(deleteButton);

                    deviceList.appendChild(li);

                    const statusBox = document.createElement('div');
                    statusBox.className = 'status-box';
                    statusBox.textContent = `${device.alias} - Checking...`;
                    statusBoxes.appendChild(statusBox);

                    fetch(`/api/device-status/${device.alias}`)
                        .then(response => response.json())
                        .then(status => {
                            statusBox.textContent = `${device.alias} - ${status.status}`;
                            statusBox.className = `status-box ${status.color}`;
                        })
                        .catch(error => {
                            console.error('Error fetching device status:', error);
                        });
                });
            })
            .catch(error => {
                console.error('Error loading devices:', error);
            });
    }

    function loadDeviceDetailsView(device) {
        fetch(`/api/device-status/${device}`)
            .then(response => response.json())
            .then(data => {
                deviceDetails.innerHTML = `
          <div class="status-box ${data.color}">
            <h3>${device}</h3>
            <p>Status: ${data.status}</p>
          </div>
        `;
            })
            .catch(error => {
                console.error('Error fetching device details:', error);
            });

        fetch(`/api/device-notifications/${device}`)
            .then(response => response.json())
            .then(notifications => {
                notificationList.innerHTML = '';
                notifications.forEach(notification => {
                    const li = document.createElement('li');
                    li.textContent = notification;
                    notificationList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error fetching device notifications:', error);
            });
    }

    function openEditDeviceModal(device) {
        currentDevice = device;
        fetch(`/api/device-details/${device}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('edit-device-alias').value = data.alias;
                document.getElementById('edit-device-ip').value = data.ip;
                document.getElementById('edit-device-port').value = data.port;
                document.getElementById('edit-device-username').value = data.username;
                document.getElementById('edit-device-password').value = data.password;
                editDeviceModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching device details for edit:', error);
            });
    }

    function openDeleteDeviceModal(device) {
        currentDeleteDevice = device;
        deleteDeviceModal.style.display = 'block';
    }

    // Initialize with view 1
    view1.classList.add('active');
    loadDeviceListView();
});

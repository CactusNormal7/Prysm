<template>
  <div v-if="roomResults.length > 0" class="room-results-notifications">
    <div class="notification-header">
      <h3>Résultats des Rooms</h3>
      <button @click="clearNotifications" class="btn btn--link">Effacer tout</button>
    </div>
    
    <div class="notifications-list">
      <div 
        v-for="notification in roomResults" 
        :key="notification.timestamp"
        class="notification-item"
        :class="{ 'positive': notification.pointsEarned > 0, 'negative': notification.pointsEarned < 0 }"
      >
        <div class="notification-content">
          <h4>{{ notification.roomName }}</h4>
          <p class="result">
            Résultat: {{ notification.result.home }} - {{ notification.result.away }}
          </p>
          <p class="points">
            <span v-if="notification.pointsEarned > 0" class="positive">
              +{{ notification.pointsEarned }} points
            </span>
            <span v-else-if="notification.pointsEarned < 0" class="negative">
              {{ notification.pointsEarned }} points
            </span>
            <span v-else class="neutral">
              {{ notification.pointsEarned }} points
            </span>
            (pari: {{ notification.pointsBet }} points)
          </p>
          <p class="rank">
            Rang: {{ notification.rank }}/{{ notification.totalParticipants }}
          </p>
          <p class="timestamp">
            {{ formatDate(notification.timestamp) }}
          </p>
        </div>
        <button @click="removeNotification(notification)" class="close-btn">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { roomResults, clearRoomResultNotifications } = useNotifications()

const clearNotifications = () => {
  clearRoomResultNotifications()
}

const removeNotification = (notification: any) => {
  const index = roomResults.value.findIndex(n => n.timestamp === notification.timestamp)
  if (index > -1) {
    roomResults.value.splice(index, 1)
  }
}

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.room-results-notifications {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.notification-header h3 {
  margin: 0;
  color: #374151;
  font-size: 18px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #e5e7eb;
  background: #f9fafb;
}

.notification-item.positive {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.notification-item.negative {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 16px;
}

.notification-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #6b7280;
}

.notification-content .result {
  font-weight: 500;
  color: #374151;
}

.notification-content .points {
  font-weight: 600;
}

.notification-content .points .positive {
  color: #10b981;
}

.notification-content .points .negative {
  color: #ef4444;
}

.notification-content .points .neutral {
  color: #6b7280;
}

.notification-content .rank {
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #6b7280;
}
</style>

<script setup lang="ts">
import AssetTable from './components/AssetTable.vue';
</script>

<template>
  <v-app>
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="py-8">
        <v-row justify="center">
          <v-col cols="12">
            <h1 class="text-h4 text-center mb-8">Qualgen IT Assets</h1>
            <AssetTable />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

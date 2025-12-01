import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";
import React from "react";

export const taskService = {
  async getAll() {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "Owner"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords('task_c', params)
      
      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return []
      }

      // Handle empty or non-existent data
      if (!response?.data?.length) {
        return []
      } else {
        return response.data
      }
    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error)
      return []
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "Owner"}}
        ]
      }

      const response = await apperClient.getRecordById('task_c', parseInt(id), params)
      
      if (!response?.data) {
        throw new Error(`Task with Id ${id} not found`)
      }
      return response.data
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error)
      throw error
    }
  },

  async create(taskData) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        records: [
          {
            Name: taskData.title_c || taskData.title || "New Task",
            title_c: taskData.title_c || taskData.title || "New Task",
            description_c: taskData.description_c || taskData.description || "",
            priority_c: taskData.priority_c || taskData.priority || "medium",
            status_c: taskData.status_c || taskData.status || "active"
          }
        ]
      }

      const response = await apperClient.createRecord('task_c', params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }
        return successful.length > 0 ? successful[0].data : null
      }
    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Map updates to database field names
      const mappedUpdates = {
        Id: parseInt(id)
      }

      if (updates.title !== undefined) mappedUpdates.title_c = updates.title
      if (updates.description !== undefined) mappedUpdates.description_c = updates.description
      if (updates.priority !== undefined) mappedUpdates.priority_c = updates.priority
      if (updates.status !== undefined) mappedUpdates.status_c = updates.status
      if (updates.title_c !== undefined) mappedUpdates.title_c = updates.title_c
      if (updates.description_c !== undefined) mappedUpdates.description_c = updates.description_c
      if (updates.priority_c !== undefined) mappedUpdates.priority_c = updates.priority_c
      if (updates.status_c !== undefined) mappedUpdates.status_c = updates.status_c

      // Update Name field to match title
      if (mappedUpdates.title_c) {
        mappedUpdates.Name = mappedUpdates.title_c
      }

      const params = {
        records: [mappedUpdates]
      }

      const response = await apperClient.updateRecord('task_c', params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
          throw new Error("Update failed")
        }
        return successful.length > 0 ? successful[0].data : null
      }
    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = { 
        RecordIds: [parseInt(id)]
      }

      const response = await apperClient.deleteRecord('task_c', params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return false
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }
        return successful.length > 0
      }
    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error)
      throw error
}
  }
}
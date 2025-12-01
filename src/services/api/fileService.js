import { getApperClient } from '@/services/apperClient';
import { toast } from 'react-toastify';

const fileService = {
  async create(formData, taskId) {
    try {
      const apperClient = await getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      // Convert files to API format using ApperSDK
      const { ApperFileUploader } = window.ApperSDK;
      const convertedFiles = ApperFileUploader.toCreateFormat(formData.task_files_c);

      // Get file information for metadata
      const firstFile = formData.task_files_c[0];
      
      const params = {
        records: [{
          Name: firstFile.Name,
          task_c: taskId, // Lookup to task table
          task_files_c: convertedFiles,
          file_name_c: firstFile.Name,
          file_size_c: Math.round(firstFile.Size / 1024), // Convert to KB
          file_type_c: firstFile.Type,
          description_c: formData.fileDescription || ""
        }]
      };

      const response = await apperClient.createRecord('files_c', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} file records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }
        
        if (successful.length > 0) {
          toast.success('Files attached successfully');
          return successful[0].data;
        }
      }
    } catch (error) {
      console.error("Error creating file record:", error?.response?.data?.message || error);
      toast.error("Failed to attach files");
      throw error;
    }
  },

  async getByTaskId(taskId) {
    try {
      const apperClient = await getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "task_files_c"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_size_c"}},
          {"field": {"Name": "file_type_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        where: [{
          "FieldName": "task_c",
          "Operator": "EqualTo",
          "Values": [parseInt(taskId)],
          "Include": true
        }]
      };

      const response = await apperClient.fetchRecords('files_c', params);
      
      if (!response?.data?.length) {
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching files:", error?.response?.data?.message || error);
      return [];
    }
  }
};

export { fileService };
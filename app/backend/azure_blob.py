import os
from azure.storage.blob import BlobServiceClient


class AzureBlobClient:
    def __init__(self, service_client: BlobServiceClient):
        self._client = service_client

    @classmethod
    def from_env(cls):
        conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if conn:
            svc = BlobServiceClient.from_connection_string(conn)
            return cls(svc)
        account = os.getenv("AZURE_STORAGE_ACCOUNT")
        key = os.getenv("AZURE_STORAGE_KEY")
        if account and key:
            url = f"https://{account}.blob.core.windows.net"
            svc = BlobServiceClient(account_url=url, credential=key)
            return cls(svc)
        raise EnvironmentError("Azure storage credentials not found in environment variables")

    def list_blobs(self, container: str, prefix: str = None):
        container_client = self._client.get_container_client(container)
        return [b.name for b in container_client.list_blobs(name_starts_with=prefix)]

    def download_blob_to_path(self, container: str, blob_name: str, dest_path: str):
        container_client = self._client.get_container_client(container)
        blob_client = container_client.get_blob_client(blob_name)
        data = blob_client.download_blob().readall()
        with open(dest_path, "wb") as f:
            f.write(data)

    def upload_file(self, container: str, blob_name: str, src_path: str, overwrite: bool = True):
        container_client = self._client.get_container_client(container)
        blob_client = container_client.get_blob_client(blob_name)
        with open(src_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=overwrite)

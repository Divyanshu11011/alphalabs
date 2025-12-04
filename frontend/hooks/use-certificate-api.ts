import { useCallback } from "react";
import { useApiClient } from "@/lib/api";

export interface CertificateResponse {
  id: string;
  result_id: string;
  verification_code: string;
  share_url: string;
  pdf_url: string;
  image_url: string;
  qr_code_url?: string;
  created_at: string;
}

export interface CertificateCreate {
  result_id: string;
}

export function useCertificateApi() {
  const { post, get } = useApiClient();

  const createCertificate = useCallback(
    async (resultId: string): Promise<CertificateResponse> => {
      return post<CertificateResponse>("/api/certificates", {
        result_id: resultId,
      });
    },
    [post]
  );

  const getCertificate = useCallback(
    async (certificateId: string): Promise<CertificateResponse> => {
      return get<CertificateResponse>(`/api/certificates/${certificateId}`);
    },
    [get]
  );

  const getCertificateByResultId = useCallback(
    async (resultId: string): Promise<CertificateResponse | null> => {
      try {
        // First try to get certificate by result_id
        // Note: This might need a backend endpoint like GET /api/certificates/by-result/{result_id}
        // For now, we'll handle it via create (which returns existing if it exists)
        const cert = await createCertificate(resultId);
        return cert;
      } catch (error) {
        // If certificate doesn't exist, create it
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
    [createCertificate]
  );

  const downloadCertificatePdf = useCallback(
    (certificateId: string) => {
      const url = `/api/certificates/${certificateId}/pdf`;
      window.open(url, "_blank");
    },
    []
  );

  const downloadCertificateImage = useCallback(
    (certificateId: string) => {
      const url = `/api/certificates/${certificateId}/image`;
      window.open(url, "_blank");
    },
    []
  );

  return {
    createCertificate,
    getCertificate,
    getCertificateByResultId,
    downloadCertificatePdf,
    downloadCertificateImage,
  };
}


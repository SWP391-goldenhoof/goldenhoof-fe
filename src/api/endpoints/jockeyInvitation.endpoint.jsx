export const JOCKEY_INVITATION_ENDPOINTS = {
  ROOT: "/jockey-invitations",
  SENT: "/jockey-invitations/sent",
  ALL_CONTRACTS: "/jockey-invitations/all-contract",
  MY_INVITATIONS: "/jockey-invitations/my-invitations",
  DETAIL: (id) => `/jockey-invitations/${id}`,
  RESPOND: (id) => `/jockey-invitations/${id}/respond`,
  CONTRACT: (id) => `/jockey-invitations/${id}/contract`,
  CONTRACT_DETAIL: (invitationId) =>
    `/jockey-invitations/${invitationId}/contract`,
  COMPLETE_CONTRACT: (contractId) =>
    `/jockey-invitations/contracts/${contractId}/complete`,
  REPORT_BREACH: "/jockey-invitations/contracts/report-breach",
  PROCESS_BREACH: (breachId) =>
    `/jockey-invitations/contracts/breaches/${breachId}/process`,
  GET_BREACH_BY_CONTRACT: (contractId) =>
    `/jockey-invitations/contracts/${contractId}/breach`,
};

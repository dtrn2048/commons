import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteRecord = createAction({
  name: 'tables-delete-record',
  displayName: 'Delete Record',
  description: 'Delete a record in a table',
  auth: PieceAuth.None(),
  props: {
    table_name: tablesCommon.table_name,
    record_id: tablesCommon.record_id,
  },
  async run(context) {
    const { record_id } = context.propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${context.server.apiUrl}v1/records/${record_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return {
      success: true
    };
  },
});

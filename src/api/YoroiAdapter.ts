import { css } from 'lit';
import { html, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';


function YoroiEnabler(this: unknown) {
  useStyles(this, [css``]);

  const [yoroiAPI, setYoroiAPI] = useState();
  const [yoroiWallet, setYoroiWallet] = useState();

  useEffect(async () => {
    const yoroi = await window.cardano.yoroi;
    if (yoroi) {
      setYoroiAPI(yoroi);

      if (await yoroi.isEnabled()) {
        setYoroiWallet(await yoroi.enable());
      }
    }
  }, []);

  const enableYoroi = async () => {
    try {
      const yoroi: any = yoroiAPI;
      if (yoroi) {
        if (!(await yoroi.isEnabled())) {
          const userWallet = await yoroi.enable();
          setYoroiWallet(userWallet);
        }
      }
    } catch (error) {
      alert(error);
    }
  };

  return html`
    <sl-card style="width: 100%">
      Yoroi

      <div slot="footer">
        <sl-button
          slot="footer"
          style="width:100%"
          variant="primary"
          @click=${enableYoroi}
          disabled
          >Select</sl-button
        >
      </div>
    </sl-card>
  `;
}

export { YoroiEnabler };

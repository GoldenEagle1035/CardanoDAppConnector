import { css } from 'lit';
import { html, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';


function NamiEnabler(this: any) {
  useStyles(this, [css``]);

  const [namiAPI, setNamiAPI] = useState();
  const [namiWallet, setNamiWallet] = useState();
  const [enableError, setEnableError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hideAlert = () => {
    setErrorMessage('');
    setEnableError(false);
  };

  const alertError = (message: string) => {
    const event = new CustomEvent('alert-error', {
      bubbles: true,
      composed: true,
      detail: { message },
    });

    this.dispatchEvent(event);
  };

  const connect = (wallet: string, name: string, icon: string) => {
    const event = new CustomEvent('connect', {
      bubbles: true,
      composed: true,
      detail: { wallet, name, icon },
    });

    this.dispatchEvent(event);
  };

  useEffect(async () => {
    const nami = await window.cardano.nami;
    if (nami) {
      setNamiAPI(nami);

      if (await nami.isEnabled()) {
        const userWallet = await nami.enable();
        setNamiWallet(userWallet);
        connect(userWallet, nami.name, nami.icon);
      }
    }
  }, [namiWallet]);

  const enableNami = async () => {
    try {
      const nami: any = namiAPI;
      if (nami) {
        if (!(await nami.isEnabled())) {
          const userWallet = await nami.enable();
          setNamiWallet(userWallet);
          setEnableError(false);
        }
      }
    } catch (error) {
      setEnableError(true);
      setErrorMessage('Unable to connect Nami wallet');
      alertError('Unable to connect Nami wallet');
    }
  };

  return html`
    <sl-card style="width: 100%">
      Nami

      <div slot="footer">
        <sl-button
          slot="footer"
          variant="primary"
          style="width:100%"
          @click=${enableNami}
          >Select</sl-button
        >
      </div>
    </sl-card>
    <sl-alert
      id="sl-alert-error"
      style="margin-top:1rem;"
      variant="danger"
      duration="3000"
      closable
      .open=${enableError}
      @sl-hide=${hideAlert}
    >
      <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
      <strong>${errorMessage}</strong></sl-alert
    >
  `;
}

export { NamiEnabler };

import { css } from 'lit';
import { html, useState, useEffect } from 'haunted';
import { useStyles } from '../hooks/useStyles';

function FlintEnabler(this: any) {
  useStyles(this, [css``]);

  const [flintAPI, setFlintAPI] = useState();
  const [flintWallet, setFlintWallet] = useState();
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
    const flint = await window.cardano.flint;
    if (flint) {
      setFlintAPI(flint);
      if (await flint.isEnabled()) {
        const userWallet = await flint.enable();
        setFlintWallet(userWallet);
        connect(userWallet, flint.name, flint.icon);
      }
    }
  }, [flintWallet]);

  const enableFlint = async () => {
    try {
      const flint: any = flintAPI;
      if (flint) {
        if (!(await flint.isEnabled())) {
          const userWallet = await flint.enable();
          setFlintWallet(userWallet);
          setEnableError(false);
        }
      }
    } catch (error) {
      setEnableError(true);
      setErrorMessage('Unable to connect Flint wallet');
      alertError('Unable to connect Flint wallet');
    }
  };

  return html`
    <sl-card style="width: 100%">
      Flint

      <div slot="footer">
        <sl-button
          style="width:100%"
          slot="footer"
          variant="primary"
          @click=${enableFlint}
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

export { FlintEnabler };

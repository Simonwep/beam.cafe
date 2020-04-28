import {observer}     from 'mobx-react';
import {Component, h} from 'preact';
import {settings}     from '../../../state';
import {bind}         from '../../../utils/preact-utils';
import {Switch}       from '../../components/Switch';
import styles         from './Options.module.scss';

@observer
export class Options extends Component<{}, {}> {

    @bind
    toggleAutoPause(newValue: boolean): void {
        settings.set('autoPause', newValue);
    }

    render() {
        return (
            <div className={styles.options}>
                <section>
                    <header>
                        <h3>Auto-pause</h3>
                        <Switch selected={settings.get('autoPause')}
                                onChange={this.toggleAutoPause}/>
                    </header>

                    <article>
                        Every download / incoming request will be paused first until
                        you explicitly &quot;confirm&quot; the file to get downloaded.
                        This increases security by preventing others downloading your
                        file while you&apos;re AFK or without knowing.
                    </article>

                </section>
            </div>
        );
    }
}
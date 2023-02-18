import { st, classes } from './new-component.st.css';

export interface NewComponentProps {
    className?: string;
    children?: React.ReactNode;
}

/**
 * This component was generated using Codux's built-in Default new component template.
 * For details on how to create custom new component templates, see https://help.codux.com/kb/en/article/configuration-for-new-components-and-templates
 */
export const NewComponent = ({ className, children = 'NewComponent' }: NewComponentProps) => {
    return <div className={st(classes.root, className)}>{children}</div>;
};

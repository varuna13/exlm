import { decorateButtons, decorateIcons } from "../../scripts/lib-franklin.js";


export default function decorate(block){

    const [heading, description, cta1, cta2] = [...block.children];
    heading?.classlist.add("announcement-ribbon-heading");
    description?.classlist.add("announcement-ribbon-description");
    decorateButtons(cta1);
    decorateButtons(cta2);
    const icon = document.createElement('span');
    icon.classList.add("icon icon-close");
    block.append(icon);
    decorateIcons(block);

}
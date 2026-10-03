# ViT-AdaLA project page

This directory is a static, dependency-free project page for the current ViT-AdaLA paper. It uses figures and measurements from `../../rebuttal/NeurlPS26-AdaLA/example_paper.tex` and its included sections and tables. The page links to the paper PDF and the [research implementation](https://github.com/JackYFL/LinearViT_MT).

The [ViT-AdaLA icon](assets/vit-adala-icon.svg) is used in the navigation bar and as the browser favicon. It depicts a visual patch grid transitioning into patches along a straight line, representing ViT linearization. Its square aspect ratio is preserved on desktop and mobile. The previous [symbol](assets/logo.svg) and [horizontal lockup](assets/logo-lockup.svg) remain available as alternative assets.

The restrained academic-page layout is inspired by the [SP-VTP project page](https://jackyfl.github.io/SP-VTP-project-page/); this page uses its own HTML and CSS and the ViT-AdaLA paper's figures and results.

To preview locally from this `project_page` directory:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`. To publish with GitHub Pages, copy this directory into a repository configured to serve its root or `/docs` folder. This page requires no build step or external assets.

After revising the paper, run these commands from this `project_page` directory to refresh the bundled PDF and any changed figure previews:

```bash
cp ../../rebuttal/NeurlPS26-AdaLA/example_paper.pdf assets/ViT-AdaLA.pdf
pdftoppm -f 1 -singlefile -png -r 120 ../../rebuttal/NeurlPS26-AdaLA/figures/AdaLA_pipeline.pdf assets/pipeline
pdftoppm -f 1 -singlefile -png -r 100 ../../rebuttal/NeurlPS26-AdaLA/figures/pca_vis_comparison.pdf assets/feature-comparison
pdftoppm -f 1 -singlefile -png -r 140 ../../rebuttal/NeurlPS26-AdaLA/figures/train_mse_loss_comparison.pdf assets/stage2-initialization
pdftoppm -f 1 -singlefile -png -r 170 ../../rebuttal/NeurlPS26-AdaLA/figures/linearization.pdf assets/motivation-linearization
pdftoppm -f 1 -singlefile -png -r 170 ../../rebuttal/NeurlPS26-AdaLA/figures/enc-dec.pdf assets/motivation-vision-transfer
```

Experimental results use dependency-free interactive SVG bar charts in `results.js`: switch datasets for the DINOv2-L and cross-backbone comparisons, or choose quality, throughput, and memory for Cityscapes. Hover, tap, or keyboard-focus a bar for exact values. All axes start at zero. In the cross-backbone comparison, backbones without reported results for the selected dataset are omitted from both the plot and the expanded data table; remaining individual missing values are shown as dashes, never zero-valued bars.

The charts read the exact-data tables in `index.html`, so update those tables when paper results change; no duplicate numerical dataset needs updating. Expand “View exact data” to inspect the tables. Without JavaScript, the tables remain visible. Check the GitHub repository access settings before announcing the implementation as publicly available.

The “Motivation” section appears before “Method” and reuses both panels of Figure 2 (`figures/linearization.pdf` and `figures/enc-dec.pdf`). It explains the long-sequence attention bottleneck, why the method reuses a pretrained visual prior, and why preserving the encoder's transferable features requires more than local attention approximation. It explicitly notes that adaptation still requires training and representation drift is not unique to ViTs.

The “Ablation & Key Insights” section adds an interactive Stage 1/2 comparison for DINOv2-L/ADE20K and SAM-H/SAM-HQ, the DINOv2-L QKV-only versus full-network tuning comparison, and the paper's Stage-2 feature-MSE initialization curve. Its insights distinguish global representation recovery from local initialization and explicitly retain the task-dependent Stage-1-only outcome. SAM-H training uses an internal foreground-segmentation dataset; evaluation uses SAM-HQ. These results come from the stage-ablation table in `sections/experiment.tex` and `tables/only-tune-qkv-tab.tex`; they do not introduce new measurements or restore the excluded CLIP-L ADE20K result.

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, CheckCircle } from 'lucide-react';

export default function PatentFilingGuide() {
  const downloadPatentDocs = () => {
    // This would trigger download of the patent documentation
    window.open('/api/functions/patent-ai-vj-copilot', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-[#f5a623]" />
          <div>
            <h2 className="text-white font-bold text-2xl">AI VJ Co-Pilot Patent Filing Materials</h2>
            <p className="text-white/60">Complete USPTO utility patent application documentation</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-semibold mb-2">Patent Title</h3>
            <p className="text-white/70 text-sm">
              "Artificial Intelligence-Powered Visual Jockey Performance System with Real-Time Adaptive Control and Proactive Suggestion Engine"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-white font-medium">20 Claims Drafted</h4>
              </div>
              <p className="text-white/60 text-sm">Independent + dependent claims covering system, method, apparatus</p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-white font-medium">10 Figures Specified</h4>
              </div>
              <p className="text-white/60 text-sm">Architecture diagrams, flowcharts, UI mockups, performance charts</p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-white font-medium">Prior Art Analyzed</h4>
              </div>
              <p className="text-white/60 text-sm">3 relevant patents identified with clear differentiation</p>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-white font-medium">$2-5M Estimated Value</h4>
              </div>
              <p className="text-white/60 text-sm">Based on income approach and comparable AI patents</p>
            </div>
          </div>

          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <h4 className="text-white font-semibold mb-3">Key Innovations Covered</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Real-time audio analysis with LSTM for musical structure prediction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>GAN-based visual synthesis conditioned on musical embeddings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Reinforcement learning for personalized suggestion ranking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Audience sentiment integration from multiple data sources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Bidirectional OSC/MIDI integration with VJ software</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Sub-50ms latency optimization techniques</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
            <h4 className="text-white font-semibold mb-2">Filing Costs Estimate</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/60">USPTO Filing Fee (Small Entity):</span>
                <span className="text-white font-mono ml-2">$2,500</span>
              </div>
              <div>
                <span className="text-white/60">Patent Attorney Fees:</span>
                <span className="text-white font-mono ml-2">$15,000-$25,000</span>
              </div>
              <div>
                <span className="text-white/60">Formal Drawings (10 figs):</span>
                <span className="text-white font-mono ml-2">$1,500-$3,000</span>
              </div>
              <div>
                <span className="text-white/60">Total Estimated Cost:</span>
                <span className="text-yellow-400 font-bold ml-2">$19,000-$30,500</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={downloadPatentDocs} className="bg-[#f5a623] hover:bg-[#e91e8c]">
              <Download className="w-4 h-4 mr-2" />
              Download Full Patent Documentation
            </Button>
            <a href="https://www.uspto.gov/patents/basics/patent-process-overview" target="_blank" rel="noopener">
              <Button variant="outline" className="border-white/20 text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                USPTO Filing Guide
              </Button>
            </a>
          </div>

          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <h4 className="text-red-400 font-semibold mb-2">⚠️ Legal Disclaimer</h4>
            <p className="text-white/70 text-xs leading-relaxed">
              This documentation is for informational purposes only and does not constitute legal advice. 
              Patent law is complex and jurisdiction-specific. Engage a registered patent attorney before filing. 
              The USPTO recommends professional representation for patent applications. This template must be 
              customized with your specific technical details, inventor information, and company data. 
              Filing deadlines are strict—failure to meet deadlines can result in loss of patent rights.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Next Steps</h3>
        <ol className="space-y-3 text-white/70 text-sm">
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">1.</span>
            <span>Review complete patent documentation (download above)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">2.</span>
            <span>Engage registered patent attorney (search USPTO attorney database)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">3.</span>
            <span>Verify all inventors have signed IP assignment agreements</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">4.</span>
            <span>Conduct freedom-to-operate analysis (attorney will coordinate)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">5.</span>
            <span>Prepare formal drawings (hire technical illustrator)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">6.</span>
            <span>File via USPTO EFS-Web (attorney handles)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">7.</span>
            <span>File PCT application within 12 months for international protection</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#f5a623] font-bold">8.</span>
            <span>Consider defensive publications for non-core innovations</span>
          </li>
        </ol>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Recommended Patent Attorneys</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div>
              <div className="text-white font-medium">Fish & Richardson P.C.</div>
              <div className="text-white/60">AI/Software patent specialists</div>
            </div>
            <a href="https://www.fr.com" target="_blank" rel="noopener">
              <Button size="sm" variant="outline" className="border-white/20 text-white">
                <ExternalLink className="w-3 h-3 mr-1" />
                Visit
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div>
              <div className="text-white font-medium">Wilson Sonsini Goodrich & Rosati</div>
              <div className="text-white/60">Tech startup IP practice</div>
            </div>
            <a href="https://www.wsgr.com" target="_blank" rel="noopener">
              <Button size="sm" variant="outline" className="border-white/20 text-white">
                <ExternalLink className="w-3 h-3 mr-1" />
                Visit
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div>
              <div className="text-white font-medium">Cooley LLP</div>
              <div className="text-white/60">Machine learning patent experts</div>
            </div>
            <a href="https://www.cooley.com" target="_blank" rel="noopener">
              <Button size="sm" variant="outline" className="border-white/20 text-white">
                <ExternalLink className="w-3 h-3 mr-1" />
                Visit
              </Button>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}